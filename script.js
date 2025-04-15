import { zoom, full_screen } from './editor.js';


let type = null;
let unknownTokens = [];
function lexer(expression) {
    unknownTokens = [];

    const lowerCase = expression.toLowerCase();
    const keywords = ["if", "iszero", "true", "false", "then", "else", "succ", "pred", "0", ":", "bool", "nat", "?", "(", ")"];
    type = null;
    const result = [];
    let wordtmp = "";

    for (let i = 0; i < lowerCase.length; i++) {
        const char = lowerCase[i];

        if (char === " " || char === "(" || char === ")" || char === ":") {
            if (wordtmp.length > 0) {
                result.push(wordtmp);
                wordtmp = "";
            }

            if (char === "(" || char === ")" || char === ":") {
                result.push(char);
            }

        } else {
            wordtmp += char;
        }
    }

    if (wordtmp.length > 0) {
        result.push(wordtmp);
    }

    const len = result.length;
    const colonCount = result.filter(t => t === ":").length;

    if (colonCount > 1) {
        throw new Error(`Typová anotácia môže byť len jedna.`);
    }

    if (colonCount === 1) {
        if (
            len < 2 ||
            result[len - 2] !== ":" ||
            !["nat", "bool", "?"].includes(result[len - 1])
        ) {
            throw new Error(`Typová anotácia musí byť na konci ako ": nat",": bool" alebo ": ?"`);
        }

        if (result[len - 1] === "nat") {
            type = "Nat";
        } else if (result[len - 1] === "bool") {
            type = "Bool";
        } else if (result[len - 1] === "?") {
            type = "?";
        }
    } else {
        type = null;
    }


    for (let i = 0; i < result.length; i++) {
        const token = result[i];
        if (!keywords.includes(token)) {
            unknownTokens.push(token);
        }
    }
    tokensForError = result;
    return result.join(' ');
}

function splitConditional(condition) {
    const stack = [];
    let ifIdx = condition.indexOf('if');
    let thenIdx = -1;
    let elseIdx = -1;

    // Locate 'then'
    for (let i = ifIdx + 2; i < condition.length; i++) {
        const char = condition[i];
        if (char === '(') stack.push('(');
        else if (char === ')') stack.pop();
        else if (condition.substring(i, i + 4) === 'then' && stack.length === 0) {
            thenIdx = i;
            break;
        }
    }

    // Locate 'else'
    for (let i = thenIdx + 4; i < condition.length; i++) {
        const char = condition[i];
        if (char === '(') stack.push('(');
        else if (char === ')') stack.pop();
        else if (condition.substring(i, i + 4) === 'else' && stack.length === 0) {
            elseIdx = i;
            break;
        }
    }

    // Extract parts
    const ifPart = condition.substring(ifIdx + 2, thenIdx).trim();
    const thenPart = condition.substring(thenIdx + 4, elseIdx).trim();
    const elsePart = condition.substring(elseIdx + 4).trim();

    return { ifPart, thenPart, elsePart };
}

function findClosingParenthesis(expr, startIdx, currentIndex, task) {
    let depth = 0;
    let nextIndex = currentIndex;
    for (let i = startIdx; i < expr.length; i++) {
        if (expr[i] === ' ') {
            nextIndex++;
        }
        if (expr[i] === '(') {
            depth++;
        } else if (expr[i] === ')') {
            depth--;
            if (depth === 0) {
                if (task === 0) {
                    let rest = expr.slice(i + 1).trim();
                    if (rest.length > 0) {
                        let indicesOfWrong = nextIndex+ 1 + calculateIndex(expr);
                        for (let i = nextIndex + 1; i <= indicesOfWrong; i++) {
                            indexOfWrongParser.push(i);
                        }
                        throw new Error("format");
                    }
                }
                return i;
            }
        }
    }
    indexOfWrongParser.push(currentIndex);
    throw new Error("zatvorky");
}

function calculateIndex(expression) {
    let beginning = 0;
    for (let i = 0; i < expression.length; i++) {
        if (expression[i] === " ") {
            beginning++;
        }
    }
    return beginning;
}


let start;
let start_i = 0;
let indexOfWrongParser = [];

function createTree(expression, indexCurrent) {
    indexOfWrongParser = [];
    if (!expression) {
        return null;
    }
    expression = expression.trim();

    if (expression.startsWith("(")) {
        const closingParenIdx = findClosingParenthesis(expression, 0, indexCurrent, 0);
        const innerExpression = expression.slice(1, closingParenIdx);
        return createTree(innerExpression, indexCurrent+1);
    } else {
        if(start_i==0) {
        start = expression;
        start_i++;
        }
    }

    if (expression.startsWith("if")) {
        const { ifPart, thenPart, elsePart } = splitConditional(expression);
    
        if (!ifPart){
            indexOfWrongParser.push(indexCurrent);
            throw new Error("if");
        } else if (!thenPart) {
            indexOfWrongParser.push(indexCurrent + (ifPart.match(/\s/g) || []).length + 2);
            throw new Error("then");
        } else if(!elsePart) {
            indexOfWrongParser.push(indexCurrent + (ifPart.match(/\s/g) || []).length + 2 + (thenPart.match(/\s/g) || []).length + 2);
            throw new Error("else");
        }
        const tree = {
            desc: "if",
            type: expression,
            condition: createTree(ifPart, indexCurrent+1),
            then: createTree(thenPart, (indexCurrent + (ifPart.match(/\s/g) || []).length + 2 + 1)),
            else: createTree(elsePart, (indexCurrent + (ifPart.match(/\s/g) || []).length + 2 + (thenPart.match(/\s/g) || []).length + 2) + 1)
        };
        
        return tree;
    }

    if (expression.startsWith("succ")) {
        const nextSegment = expression.slice(5).trim();
        const nextChar = nextSegment.charAt(0);
        if(nextChar === "") {
            indexOfWrongParser.push(indexCurrent); 
            throw new Error("succ/iszero/pred");
        }
        const tree = {
            type: expression,
            desc: "succ",
            argument: createTree(expression.slice(5).trim(),indexCurrent+1)
        };
        return tree;
    }

    if (expression.startsWith("pred")) {
        const nextSegment = expression.slice(5).trim();
        const nextChar = nextSegment.charAt(0);
        if(nextChar === "") {
            indexOfWrongParser.push(indexCurrent); 
            throw new Error("succ/iszero/pred");
        }
        const tree = {
            type: expression,
            desc: "pred",
            argument: createTree(expression.slice(5).trim(), indexCurrent+1)
        };
        return tree;
    }

    if (expression.startsWith("iszero")) {
        const nextSegment = expression.slice(7).trim();
        const nextChar = nextSegment.charAt(0);
        if(nextChar === "") {
            indexOfWrongParser.push(indexCurrent); 
            throw new Error("succ/iszero/pred");
        }
        const tree = {
            type: expression,
            desc: "iszero",
            argument: createTree(expression.slice(7).trim(), indexCurrent+1)
        };
        return tree;
    }

    if (expression === "true") {
        return { type: "true", desc: "true"};
    }

    if (expression === "false") {
        return { type: "false", desc: "false"};
    }

    if (expression === "0") {
        return { type: "0", desc: "0"};
    }

    if (expression.startsWith("true") || expression.startsWith("false") || expression.startsWith("0")) {
        let indicesOfWrong = indexCurrent + calculateIndex(expression);
        for (let i = indexCurrent+1; i <= indicesOfWrong; i++) {
            indexOfWrongParser.push(i);
        }
        throw new Error(`literal`);
    }
    let indicesOfWrong = indexCurrent + calculateIndex(expression);
    for (let i = indexCurrent; i <= indicesOfWrong; i++) {
        indexOfWrongParser.push(i);
    }
    throw new Error ("format");
}

function createTreeWithTypes(expression, expectedType) {
    if (!expression) return null;
    expression = expression.trim();

    if (expression.startsWith("(")) {
        const closingParenIdx = findClosingParenthesis(expression, 0, 0, 1);
        const innerExpression = expression.slice(1, closingParenIdx);
        return createTreeWithTypes(innerExpression, expectedType);
    }


    if (expression === "true") {
        if(expectedType === "Bool") {
            return { type: "true", desc: "true", typing:"Bool" };
        } else {
            return { type: "true", desc: "true", typing:"Nat", error: true};
        }
    }

    if (expression === "false") {
        if(expectedType === "Bool") {
            return { type: "false", desc: "false", typing:"Bool" };
        } else {
            return { type: "false", desc: "false", typing:"Nat", error: true};
        }
    }

    if (expression === "0") {
        if(expectedType === "Nat") {
            return { type: "0", desc: "0", typing:"Nat" };
        } else {
            return { type: "0", desc: "0", typing:"Bool", error: true};
        }
    }

    if (expression.startsWith("succ")) {
        const subTree = createTreeWithTypes(expression.slice(5).trim(), "Nat");
        if(expectedType === "Nat") {
            return { type: expression, desc: "succ", typing:"Nat", argument: subTree };
        } else {
            return { type: expression, desc: "succ", typing:"Bool" ,error: true};
        }
    }

    if (expression.startsWith("pred")) {
        const subTree = createTreeWithTypes(expression.slice(5).trim(), "Nat");
        if(expectedType === "Nat") {
            return { type: expression, desc: "pred", typing:"Nat", argument: subTree };
        } else {
            return { type: expression, desc: "pred", typing:"Bool" ,error: true};
        }
    }

    if (expression.startsWith("iszero")) {
        const subTree = createTreeWithTypes(expression.slice(7).trim(), "Nat");
        if(expectedType === "Bool") {
            return { type: expression, desc: "iszero", typing:"Bool", argument: subTree };
        } else {
            return { type: expression, desc: "iszero", typing:"Nat" ,error: true};
        }
    }

    if (expression.startsWith("if")) {
        const { ifPart, thenPart, elsePart } = splitConditional(expression);
        const tree = {
            desc: "if",
            type: expression,
            condition: createTreeWithTypes(ifPart, "Bool"),
            then: createTreeWithTypes(thenPart, expectedType),
            else: createTreeWithTypes(elsePart, expectedType),
            typing:expectedType
        };
        return tree;
    }
}

let wrongTyped = false;
function generateProofTree(tree, maxDepth) {
    if (!tree) {
        throw new Error("Invalid tree");
    }
    wrongTyped = false;
    let proofTree = `\\begin{prooftree}`;

    function getNodeLabel(node) {
        if (node.error) {
            wrongTyped = true;
            return `${node.type} : ${node.typing} - ZLE`;
        } else {
            return type ? `${node.type} : ${node.typing}` : `${node.type} ∈ Term`;
        }
    }

    function buildTree(node, currentDepth = 1) {
        if (!node || currentDepth > maxDepth) return "";
        
        if (node.desc === "0" || node.desc === "true" || node.desc === "false") {
            return `\\AxiomC{${getNodeLabel(node)}}`;
        }
    
        let subTree = node.argument ? buildTree(node.argument, currentDepth + 1) : ""; // Only build if argument exists
    
        if (node.desc === "succ" || node.desc === "pred" || node.desc === "iszero") {
            return `${subTree} ${subTree ? `\\RightLabel{(${node.desc})}\\UnaryInfC{${getNodeLabel(node)}}` : `\\AxiomC{${getNodeLabel(node)}}`}`;
        }
    
        if (node.desc === "if") {
            let conditionSubTree = node.condition ? buildTree(node.condition, currentDepth + 1) : "";
            let thenSubTree = node.then ? buildTree(node.then, currentDepth + 1) : "";
            let elseSubTree = node.else ? buildTree(node.else, currentDepth + 1) : "";
    
            return `${conditionSubTree}
                    ${thenSubTree}
                    ${elseSubTree}
                    ${conditionSubTree && thenSubTree && elseSubTree ? `\\RightLabel{(${node.desc})}` : ""}
                    ${currentDepth < maxDepth ? `\\TrinaryInfC{${getNodeLabel(node)}}` : `\\AxiomC{${getNodeLabel(node)}}`}`;
        }
    
        return "";
    }

    proofTree += buildTree(tree);
    proofTree += "\\end{prooftree}";
    return "<p><br>" + proofTree + "</p>";
}

function sizeCount(tree) {
    // Initialize a queue with the root node
    let queue = [tree];
    let size = 0;
    let output = `<p><br>\\begin{align} \n`; // Initialize the table

    while (queue.length > 0) {
        const currentLevel = [];
        const nextQueue = [];
        let currentLevelSize = 0;

        // Process each node at the current level
        queue.forEach((node) => {
            currentLevel.push(`\\text{Size}\\text{(${node.type})}`);
            currentLevelSize++; // Count the current node

            // Check if the node has an argument (child node) and add to nextQueue
            if (node.argument) nextQueue.push(node.argument);

            // If the node is of type "if", check condition, then, and else children
            if (node.condition) nextQueue.push(node.condition);
            if (node.then) nextQueue.push(node.then);
            if (node.else) nextQueue.push(node.else);
        });

        // Prepare the row for the current level
        const currentLevelString = currentLevel.join(' + ');
        const sizeCalculation = size === 0 ? currentLevelString : `${currentLevelString} + ${size}`;
        output += size === 0 ?` & ${sizeCalculation} \\\\ \n`: `&= ${sizeCalculation} \\\\ \n`;
            
        // Update the total size count
        size += currentLevelSize;
        
        // Move to the next level
        queue = nextQueue;
    }

    // Final output with total size
    output += ` &= ${size} \n\\end{align}</p>`;
    document.getElementById("size").innerHTML = output;
}

function conCount(tree) {
    // Initialize a queue with the root node
    let queue = [tree];
    let output = `<br>\\begin{align} \n`; // Initialize the table
    let constants = [];
    let count = 0;
    while (queue.length > 0) {
        const currentLevel = [];
        const nextQueue = [];
        let newConstants = [];
        // Process each node at the current level
        queue.forEach((node) => {
            currentLevel.push(`\\text{Con}\\text{(${node.type})}`);

            // Check for constants
            if (node.type === "0") {
                newConstants.push("0");
            } else if (node.type === "true") {
                newConstants.push("true");
            } else if (node.type === "false") {
                newConstants.push("false");
            }

            // Check if the node has an argument (child node) and add to nextQueue
            if (node.argument) nextQueue.push(node.argument);

            // If the node is of type "if", check condition, then, and else children
            if (node.condition) nextQueue.push(node.condition);
            if (node.then) nextQueue.push(node.then);
            if (node.else) nextQueue.push(node.else);
        });

        // Prepare the row for the current level
        const currentLevelString = currentLevel.join(' ∪ ');

        // Generate a string for constants, showing each constant separately
        const constantsString = constants.length > 0 ? constants.map(constant => `∪ \\lbrace${constant === "true" || constant === "false" ? `\\text{${constant}}` : constant}\\rbrace`).join(' ') : '';


        // Combine current level calculation with constants
        const constantCalculation = `${currentLevelString}${constantsString}`;
        output += `& ${count === 0 ? constantCalculation : `= ${constantCalculation}`}\\\\ \n`;
        count++;
        for (let i = 0; i < newConstants.length; i++) {
            constants.push(newConstants[i]);
        }
        // Move to the next level
        queue = nextQueue;
    }

    // Final output with unique constants
    const uniqueConstants = Array.from(new Set(constants)); // To ensure unique constants in final output
    const finalConstantString = uniqueConstants.length > 0 ? `{${uniqueConstants.join(',')}}` : '{}';
    output += `& = \\lbrace \\text${finalConstantString} \\rbrace \n\\end{align}`; // Final unique constants

    document.getElementById("constants").innerHTML = `<p>${output}</p>`; // Close the table
}

let vypocetPomocny = 0;
let condition_nodes = [];
let first = true;
function calculateConditionalDepth(node_condition, node_then, node_else, depths, closed, depth, depth_output) {
    let firstDepth = updateDepth(node_condition, 0, depths, closed, depth, depth_output, node_then, node_else);
    let secondDepth = updateDepth(node_then, 1, depths, closed, depth, depth_output, node_condition, node_else);
    let thirdDepth = updateDepth(node_else, 2, depths, closed, depth, depth_output, node_condition,node_then);
    depth_output.push(`& = \\text{max(${firstDepth}, ${secondDepth}, ${thirdDepth})${depth !== 0 ? ' + ' + depth : ''}} \\\\ \n`);

    if (node_condition.argument) {
        depths[0]++;
        return calculateConditionalDepth(node_condition.argument, node_then, node_else, depths, closed, depth, depth_output);
    } else if (!node_condition.argument) {
        if (!closed[0]) {
            depths[0]++;
            closed[0] = true;
            firstDepth = `${depths[0]}`;
            depth_output.push(`& = \\text{max(${firstDepth}, ${secondDepth}, ${thirdDepth})${depth !== 0 ? ' + ' + depth : ''}} \\\\ \n`);

        }
    }

    if (node_then.argument) {
        depths[1]++;
        return calculateConditionalDepth(node_condition, node_then.argument, node_else, depths, closed, depth, depth_output);
    } else if (!node_then.argument) {
        if (!closed[1]) {
            depths[1]++;
            closed[1] = true;
            secondDepth = `${depths[1]}`;
            depth_output.push(`& = \\text{max(${firstDepth}, ${secondDepth}, ${thirdDepth})${depth !== 0 ? ' + ' + depth : ''}} \\\\ \n`);

        }
    }

    if (node_else.argument) {
        depths[2]++;
        return calculateConditionalDepth(node_condition, node_then, node_else.argument, depths, closed, depth, depth_output);
    } else if (!node_else.argument) {
        if (!closed[2]) {
            depths[2]++;
            closed[2] = true;
            thirdDepth = `${depths[2]}`;
            depth_output.push(`& = \\text{max(${firstDepth}, ${secondDepth}, ${thirdDepth})${depth !== 0 ? ' + ' + depth : ''}} \\\\ \n`);

        }

        const biggest = Math.max(...depths);
        if (depth !== 0) {
            depth_output.push(`& = ${biggest} + ${depth} \\\\ \n`);
            depth_output.push(first ? `& = ${biggest + depth} \\\\ \n` : `& = ${biggest + depth} \\\\ \n`);
        } else {
            depth_output.push(first ? `& = ${biggest} \\\\ \n` : `& = ${biggest} \\\\ \n`);
        }        

        if (first && condition_nodes) {
            first = false;
            const colors = ["blue", "green", "purple", "orange", "brown", "pink", "teal", "cyan", "lime"];
            const typeColors = {}; // Store assigned colors for each unique type
            let colorIndex = 0;

            for (let conditionNode of condition_nodes) {
                if (!typeColors[conditionNode.type]) {
                    typeColors[conditionNode.type] = colors[colorIndex % colors.length];
                    colorIndex++;
                }
            }

            // Find the last occurrence of each type and apply coloring
            let lastIndices = {}; // Store last index of each type

            for (let i = depth_output.length - 1; i >= 0; i--) {
                for (let conditionNode of condition_nodes) {
                    let type = conditionNode.type;
                    if (!lastIndices[type] && depth_output[i].includes(type)) {
                        lastIndices[type] = i; // Store the last index where the type appears
                    }
                }
            }

            let lines = [];
            for (let [type, index] of Object.entries(lastIndices)) {
                let color = typeColors[type];
                let targetLine = depth_output[index];
                const replacedPart = `}\\textcolor{${color}}{\\text{${type}}}\\text{`;
                targetLine = targetLine.replace(`${type}`, replacedPart);
                depth_output[index] = targetLine;
                const modifiedPart = replacedPart.slice(1, replacedPart.length-6);
                lines.push({ node: condition_nodes.find(node => node.type === type), modifiedPart });
            }

            lines.sort((a, b) => {
                const aIndex = condition_nodes.findIndex(node => node.type === a.node.type);
                const bIndex = condition_nodes.findIndex(node => node.type === b.node.type);
                return aIndex - bIndex;
            });

            let sortedLines = modifyLinesByDependency(lines);
            
            let orderedLastIndices = condition_nodes.map(node => ({
                type: node.type,
                index: lastIndices[node.type] ?? -1
            }));

            for (let sortedLine of sortedLines) {
                depth_output.push(`& \\textcolor{red}{\\text{Pomocný výpočet : }}\\text{depth(}${sortedLine.modifiedPart}) \\\\ \n`);
                calculateDepth(sortedLine.node, depth = 0, depth_output);

                vypocetPomocny++;
                const presun = extractPomocnyVypocetFromArray(depth_output, vypocetPomocny);

                let type = sortedLine.node.type;  // Get the type from the current sorted line

                const updatedIndices = updateIndices(orderedLastIndices);
                const matchingEntry = Object.values(updatedIndices).find(entry => entry.type === type);
                let insertIndex = matchingEntry.index + 1;
                // Insert 'presun' at the desired position
                depth_output.splice(insertIndex, 0, presun.join(''));
                
            }
        }
    }
    return depth_output;
} 

function updateIndices(orderedLastIndices) {
    let new_levels = {};
    let first = orderedLastIndices[0].index;

    for (let i = 0; i < orderedLastIndices.length; i++) {
        if (orderedLastIndices[i].index === first) {
            new_levels[i] = { ...orderedLastIndices[i] }; // Create a new object to avoid reference issues
        } else {
            const plus = count_different_before(orderedLastIndices, orderedLastIndices[i]);
            new_levels[i] = { ...orderedLastIndices[i], index: orderedLastIndices[i].index + plus };
        }
    }
    
    return new_levels; // Return the updated object
}

function count_different_before(orderedLastIndices, node) {
    let count = 0;
    for (let i = 0; i < orderedLastIndices.length; i++) {
        if (orderedLastIndices[i].index !== node.index) {
            count++;
        } else {
            break;
        }
    }
    return count;
}

function extractPomocnyVypocetFromArray(depth_output, occurrence) {
    let output = [];
    let occurrenceCount = 0;
    let found = false;
    let removeIndices = [];

    for (let i = 0; i < depth_output.length; i++) {
        let line = depth_output[i];

        if (!found) {
            if (line.includes("Pomocný výpočet")) {
                occurrenceCount++;
                if (occurrenceCount === occurrence) {
                    output.push(line);
                    removeIndices.push(i);
                    found = true;
                }
            }
        } else {
            if (line.includes("Pomocný výpočet")) {
                break;
            } else {
                output.push(line);
                removeIndices.push(i);
            }
        }
    }

    output.push(`& \\\\ \n`);

    // Remove extracted lines from the original array
    for (let i = removeIndices.length - 1; i >= 0; i--) {
        depth_output.splice(removeIndices[i], 1);
    }
    return output;
}

function dependsOn(inner, outer) {
    // Check if 'outer' type contains 'inner' type
    return outer.includes(inner);
}

function modifyLinesByDependency(lines) {
    let remaining = [...lines];

    for (let i = 0; i < remaining.length; i++) {
        let line = remaining[i];
        let node = line.node;

        // Iterate through other lines to check dependencies
        for (let otherLine of remaining) {
            if (otherLine !== line && dependsOn(otherLine.node.type, node.type)) {
                // Modify the part of the line based on the dependency
                line.modifiedPart = line.modifiedPart.replace(`${otherLine.node.type}`, `}${otherLine.modifiedPart}\\text{`);
            }
        }
    }

    return remaining;
}

function updateDepth(node, index, depths, closed, depth, depth_output, node2, node3) {
    if (node.condition && !closed[index]) {
        if (depths[index] !== 0){
            if(index === 0) {
                let secondDepth = updateDepth(node2, 1, depths, closed);
                let thirdDepth = updateDepth(node3, 2, depths, closed);
                depth_output.push(`& = \\text{max(depth(${node.type})${depths[0] !== 0 ? ' + ' + depths[0] : ''}, ${secondDepth}, ${thirdDepth})${depth !== 0 ? ' + ' + depth : ''}} \\\\ \n`);
            } else if (index === 1) {
                let firstDepth = updateDepth(node2, 0, depths, closed);
                let thirdDepth = updateDepth(node3, 2, depths, closed);
                depth_output.push(`& = \\text{max(${firstDepth}, depth(${node.type})${depths[1] !== 0 ? ' + ' + depths[1] : ''}, ${thirdDepth})${depth !== 0 ? ' + ' + depth : ''}} \\\\ \n`);
            } else {
                let firstDepth = updateDepth(node2, 0, depths, closed);
                let secondDepth = updateDepth(node3, 1, depths, closed);
                depth_output.push(`& = \\text{max(${firstDepth}, ${secondDepth}, depth(${node.type})${depths[2] !== 0 ? ' + ' + depths[2] : ''})${depth !== 0 ? ' + ' + depth : ''}} \\\\ \n`);
            }
        }
        const depth_inner = treeDepth(node);
        depths[index] += depth_inner;
        closed[index] = true;
        return `${depths[index]}`;
    } else if (node.argument || !closed[index]) {
        return `depth(${node.type})${depths[index] !== 0 ? ` + ${depths[index]}` : ''}`;
    } else {
        return `${depths[index]}`;
    }
}

function treeDepth(node) {
    if (!node || typeof node !== "object") return 0;
  
    let maxDepth = 0;
  
    // Check possible child nodes
    if (node.argument) {
      maxDepth = Math.max(maxDepth, treeDepth(node.argument));
    }
    if (node.condition) {
      maxDepth = Math.max(maxDepth, treeDepth(node.condition));
      if (first && !condition_nodes.some(existingNode => existingNode === node)) {
        condition_nodes.push(node);
      }
    }
    if (node.then) {
      maxDepth = Math.max(maxDepth, treeDepth(node.then));
    }
    if (node.else) {
      maxDepth = Math.max(maxDepth, treeDepth(node.else));
    }
  
    return 1 + maxDepth;
}
    
function calculateDepth(node, depth = 0 , depth_output = []) {
    while (node) {
        if (first) depth_output.push(`&${depth === 0 ? `` : `= `} \\text{${depth === 0 ? `depth(${node.type})` : `depth(${node.type}) + ${depth}`}}\\\\ \n`);
        depth++;

        if (node.condition) {
            let depths = [0, 0, 0];
            let closed = [false, false, false];
            if(first) depth_output.push(`& = \\text{max(depth(${node.condition.type}), depth(${node.then.type}), depth(${node.else.type})${depth !== 0 ? ' + ' + depth : ''}} \\\\ \n`);
            return calculateConditionalDepth(node.condition, node.then, node.else, depths, closed, depth, depth_output);
        }

        node = node.argument;
        if (!node) {
            break;
        }
    }
    const lastEntry = depth_output[depth_output.length - 1];
    if (lastEntry.includes("&=  \\text{")) {
        depth_output.push(`& = ${depth}\\\\ \n`);
    }
    return depth_output;
}

function removeUnnecessaryParentheses(expression) {
    return expression
        .replace(/\(\s*([0-9]+)\s*\)/g, '$1')  // Remove parentheses around numbers
        .replace(/\(\s*(true|false)\s*\)/g, '$1') // Remove parentheses around boolean values
        .replace(/pred \(\s*([0-9]+)\s*\)/g, 'pred $1') // Remove unnecessary parentheses after pred
        .replace(/succ \(\s*([0-9]+)\s*\)/g, 'succ $1') // Remove unnecessary parentheses after succ
        .replace(/iszero \(\s*([0-9]+)\s*\)/g, 'iszero $1'); // Remove unnecessary parentheses after iszero
}

function removeUnnecessaryParentheses2(expr) {
    let i = 0;
    while (i < expr.length) {
        if (expr[i] === '(') {
            try {
                // Find the matching closing parenthesis
                const closingIdx = findClosingParenthesis(expr, i, 0, 1);
                // Skip to the character after the closing parenthesis
                i = closingIdx + 1;
            } catch (error) {
                // If there's no matching closing parenthesis, remove the unmatched opening parenthesis
                expr = expr.slice(0, i) + expr.slice(i + 1);
                // Don't reset i, continue from the current position
            }
        } else {
            i++;  // Move to the next character if it's not an opening parenthesis
        }
    }
    return expr;
}

function evaluateExpression(expression) {
    let steps = [];
    let currentExpression = expression;
    function evaluateStep(expr) {
        expr = removeUnnecessaryParentheses(expr); // Apply before each evaluation step
    
        if (expr.includes("succ true") || expr.includes("succ false")) {
            return expr;  // Invalid expression, stop evaluation
        }
    
        if (expr.includes("pred true") || expr.includes("pred false")) {
            return expr;  // Invalid expression, stop evaluation
        }
        if (expr.includes('iszero true') || expr.includes('iszero false')) {
            return expr; // Invalid, should not reduce
        }
        // Rule for iszero 0
        if (expr.includes('iszero 0')) {
            return expr.replace('iszero 0', 'true');
        }
        // Rule for iszero(succ nv1)
        if (expr.includes('iszero ( succ 0 )')) {
            return expr.replace('iszero ( succ 0 )', 'false');
        }           
        if (expr.includes('pred 0')) {
            return expr.replace('pred 0', '0');
        }
        if (expr.includes('pred ( succ 0 )')) {
            return expr.replace('pred ( succ 0 )', '0');
        }
        if (expr.includes('if')) {
            const ifIdx = expr.indexOf('if');
            const { ifPart, thenPart, elsePart } = splitConditional(expr);
    
            // Ensure the condition is a boolean before evaluating
            if (ifPart !== 'true' && ifPart !== 'false') {
                return expr; // Stop evaluation if the condition is not a boolean
            }
    
            let replacement = ifPart === 'true' ? thenPart : elsePart;
            // Remove unnecessary parentheses after the replacement
            let replacedExpr = expr.slice(0, ifIdx) + replacement + expr.slice(expr.indexOf(elsePart-1),elsePart.length);
            replacedExpr = removeUnnecessaryParentheses(replacedExpr);
            // Remove any unnecessary outer parentheses that may have remained
            return removeUnnecessaryParentheses2(replacedExpr);
        }     
        if (expr.match(/pred \( succ \((.*?)\) \)/)) {
            return expr.replace(/pred \( succ \((.*?)\) \)/, '$1');
        }
        return expr;
    } 
    let previousExpression;
    do {
        previousExpression = currentExpression;
        steps.push(currentExpression); 
        currentExpression = evaluateStep(currentExpression);
        currentExpression = removeUnnecessaryParentheses(currentExpression);
    } while (currentExpression !== previousExpression);

    steps.push(currentExpression);

    let latexHTML = '<p><br>\\begin{align} \\\\ \n';
    let i = 0;
    steps.forEach((step, index) => {
        if (index < steps.length - 1) {
            if (i == 0) {
                latexHTML += `& \\text{${step}} \\\\ \n`;
                i++;
            } else {
                latexHTML += `& \\rightarrow \\text{${step}} \\\\ \n`;
            }
        }
    });
    latexHTML += '\\end{align}</p>';
    document.getElementById('evaluate').innerHTML = latexHTML;
}

function addPercentToRows(latexCode, x) {
    // Split the LaTeX code into lines
    const lines = latexCode.split('\n');
    
    // Add "%" at the beginning of each line starting from row x to the second-to-last row
    for (let i = x - 1; i < lines.length - 1; i++) {
      lines[i] = "%" + lines[i];
    }
    
    // Join the lines back together and return the modified LaTeX code
    return lines.join('\n');
}

function removeFirstPercent(text) {
    // Find the index of the first occurrence of "%"
    const index = text.indexOf('%');
    
    // If "%" is found, remove it and return the updated string
    if (index !== -1) {
      return text.slice(0, index) + text.slice(index + 1);
    }
    
    // If "%" is not found, return the original string
    return text;
}

function displayTree(level){
    const visualizationContainer = document.getElementById('visualization');
    const errorContainer = document.querySelector('.error_container');
    if (type === "Bool" || type === "Nat") {
        treeData = createTreeWithTypes(tokenizedExpression, type);
        visualizationContainer.innerHTML = generateProofTree(treeData, document.getElementById("stepCheckbox").checked ? level : 1000);
        if (document.getElementById("stepCheckbox").checked) {
            document.getElementById('visualButton').style.display = 'block';
        }
    } else if (type === "?") {
        if (document.getElementById("stepCheckbox").checked) {
            errorContainer.innerHTML = 'Chyby : <br><br>Na overenie existencie typu vypni krokovanie.';
        } else {
            treeData = createTreeWithTypes(tokenizedExpression, "Nat");
            generateProofTree(treeData, document.getElementById("stepCheckbox").checked ? level : 1000);
            if (wrongTyped) {
                treeData = createTreeWithTypes(tokenizedExpression, "Bool");
                generateProofTree(treeData, document.getElementById("stepCheckbox").checked ? level : 1000);
                if (wrongTyped) {
                    visualizationContainer.innerHTML = `<br>
                    <div style="text-align: center; font-weight: bold; margin-top: 5px;">
                        Pre daný term neexistuje typ.
                    </div>
                    `;
                } else {
                    visualizationContainer.innerHTML = generateProofTree(treeData, document.getElementById("stepCheckbox").checked ? level : 1000);
                }
            } else {
            visualizationContainer.innerHTML = generateProofTree(treeData, document.getElementById("stepCheckbox").checked ? level : 1000);
            }
        }
   } else {
        treeData = createTree(tokenizedExpression, 0);
        visualizationContainer.innerHTML = generateProofTree(treeData, document.getElementById("stepCheckbox").checked ? level : 1000);
        if (document.getElementById("stepCheckbox").checked) {
            document.getElementById('visualButton').style.display = 'block';
        }
    }
}

let tokenizedExpression;
let tmpType;
let treeData;
window.sizeLatex = "";
window.conLatex = "";
window.evalLatex = "";
window.depthLatex = "";
window.tree = "";
let tokensForError = [];
document.getElementById("drawTree").addEventListener("click", () => {
    const expression = window.editor.getValue();
    const visualizationContainer = document.getElementById('visualization');
    const sizeContainer = document.getElementById('size');
    const conContainer = document.getElementById('constants');
    const depthContainer = document.getElementById('depth');
    const evaluationContainer = document.getElementById('evaluate');
    const errorContainer = document.querySelector('.error_container');
    document.getElementById('sizeButton').style.display = 'none';
    document.getElementById('conButton').style.display = 'none';
    document.getElementById('evalButton').style.display = 'none';
    document.getElementById('visualButton').style.display = 'none';
    document.getElementById('depthButton').style.display = 'none';
    if (expression) {
        condition_nodes = [];
        first = true;
        start_i = 0;
        errorContainer.innerHTML = "Chyby";
        visualizationContainer.innerHTML = "";
        evaluationContainer.innerHTML = "";
        window.sizeLatex = "";
        window.conLatex = "";
        window.evalLatex = "";
        window.depthLatex = "";
        window.tree = "";
        tokenizedExpression = "";
        level = 1;
        vypocetPomocny = 0;
        treeData = "";
        try {
            tokenizedExpression = lexer(expression);
            window.insertText(tokenizedExpression);
            if (unknownTokens.length > 0) {
                throw new Error("lex");
            }

            let testParser = tokenizedExpression;
            if (type != null) {
                testParser = testParser.slice(0, (testParser.indexOf(":") - 1));
            }
            let treeDataNew = createTree(testParser, 0);

            if(type != null) {
                tokenizedExpression = tokenizedExpression.slice(0, tokenizedExpression.indexOf(":") - 1).trim();
            }
            displayTree(level);
            window.tree = visualizationContainer.innerHTML;
            sizeCount(treeDataNew);
            conCount(treeDataNew);
            depthContainer.innerHTML = `<p><br>\\begin{align}\n` + calculateDepth(treeDataNew).join("") + `\\end{align}</p>`;
            if(wrongTyped == false) {
                tmpType = type; 
                evaluateExpression(lexer(start)); 
                type = tmpType;
                window.evalLatex = evaluationContainer.innerHTML;
            }

            window.sizeLatex = sizeContainer.innerHTML;
            window.conLatex = conContainer.innerHTML;
            window.depthLatex = depthContainer.innerHTML;

            if (document.getElementById("stepCheckbox").checked) {
                sizeContainer.innerHTML = addPercentToRows(sizeContainer.innerHTML, 3);
                conContainer.innerHTML = addPercentToRows(conContainer.innerHTML, 3);
                document.getElementById('sizeButton').style.display = 'block';
                document.getElementById('conButton').style.display = 'block';
                window.sizeLatex = sizeContainer.innerHTML;
                window.conLatex = conContainer.innerHTML;
                depthContainer.innerHTML = addPercentToRows(depthContainer.innerHTML, 3);
                document.getElementById('depthButton').style.display = 'block';
                window.depthLatex = depthContainer.innerHTML;
                if(wrongTyped == false) {
                    evaluationContainer.innerHTML = addPercentToRows(evaluationContainer.innerHTML, 3);
                    document.getElementById('evalButton').style.display = 'block';
                    window.evalLatex = evaluationContainer.innerHTML;
                }
            }
            MathJax.typeset();
            zoom();
            full_screen();
        } catch (error) {
            console.log(error.message);
            let highlighted = [];
            if (error.message === "lex") {
                for (let word of tokensForError) {
                    if (unknownTokens.includes(word)) {
                        highlighted.push( `<span style="color: red;">${word}</span>`);
                    } else {
                        highlighted.push(word);
                    }
                }
                errorContainer.innerHTML = `Chyby : <br><br>Vo vašom vstupe sa nachádzajú neznáme termy : <br><br>${highlighted.join(' ')}`;    
            }
            else if (error.message === "succ/iszero/pred" || error.message === "if" || error.message === "then" || error.message === "else" || error.message === "zatvorky") {
                let explanation = "";
                if (error.message === "succ/iszero/pred") {
                    explanation = `Za "succ/iszero/pred" musí následovať literál alebo ďalší term :`;
                } else if (error.message === "if") {
                    explanation = `Neúplná podmienka - obsah časti "if" je prázdny :`;
                } else if (error.message === "then") {
                    explanation = `Neúplná podmienka - obsah časti "then" je prázdny :`;
                } else if (error.message === "else") {
                    explanation = `Neúplná podmienka - obsah časti "else" je prázdny :`;
                } else {
                    explanation = `Daná zátvorka nie je uzatvorená :`;
                }
            
                for (let i = 0; i < tokensForError.length; i++) {
                    let word = tokensForError[i];
                    if (indexOfWrongParser.includes(i)) {
                        highlighted.push(`<span style="color: red;">${word}</span>`);
                    } else {
                        highlighted.push(word);
                    }
                }
            
                errorContainer.innerHTML = `Chyby : <br><br>${explanation} <br><br>${highlighted.join(' ')}`;
            }
            else if(error.message === "format") {
                for (let i = 0; i < tokensForError.length; i++) {
                    let word = tokensForError[i];
                    if (indexOfWrongParser.includes(i)) {
                        highlighted.push(`<span style="color: red;">${word}</span>`);
                    } else {
                        highlighted.push(word);
                    }
                }
                errorContainer.innerHTML = `Chyby : <br><br>Daný výraz je nesprávne formátovaný: <br><br>${highlighted.join(' ')}`;
            }
            else if (error.message === "literal") {
                for (let i = 0; i < tokensForError.length; i++) {
                    let word = tokensForError[i];
                    if (indexOfWrongParser.includes(i)) {
                        highlighted.push(`<span style="color: red;">${word}</span>`);
                    } else {
                        highlighted.push(word);
                    }
                }
                errorContainer.innerHTML = `Chyby : <br><br>Za literálom nesmie následovať nič : <br><br>${highlighted.join(' ')}`;
            }
            visualizationContainer.innerHTML = "";
            sizeContainer.innerHTML = "";
            conContainer.innerHTML = "";
            depthContainer.innerHTML = "";
            evaluationContainer.innerHTML = "";
            window.sizeLatex = "";
            window.conLatex = "";
            window.evalLatex = "";
            window.depthLatex = "";
            window.tree = "";
            document.getElementById('sizeButton').style.display = 'none';
            document.getElementById('evalButton').style.display = 'none';
            document.getElementById('conButton').style.display = 'none';
            document.getElementById('visualButton').style.display = 'none';
            document.getElementById('depthButton').style.display = 'none';   
        }
    } else {
        errorContainer.innerHTML = `<span style="color: red;">Chyby : <br><br>Zadaj výraz.</span>`;
        visualizationContainer.innerHTML = "";
        sizeContainer.innerHTML = "";
        conContainer.innerHTML = "";
        depthContainer.innerHTML = "";
        evaluationContainer.innerHTML = "";
        window.sizeLatex = "";
        window.conLatex = "";
        window.evalLatex = "";
        window.depthLatex = "";
        window.tree = "";
        document.getElementById('sizeButton').style.display = 'none';
        document.getElementById('evalButton').style.display = 'none';
        document.getElementById('conButton').style.display = 'none';
        document.getElementById('visualButton').style.display = 'none';
        document.getElementById('depthButton').style.display = 'none';
    }
});

let level = 1;
document.getElementById("visualButton").addEventListener("click", () => {
    level++;
    displayTree(level);
    window.tree = document.getElementById('visualization').innerHTML;
    MathJax.typeset();
});

document.getElementById("sizeButton").addEventListener("click", () => {
    window.sizeLatex = removeFirstPercent(window.sizeLatex);
    document.getElementById('size').innerHTML = window.sizeLatex;
    MathJax.typeset();
});

document.getElementById("conButton").addEventListener("click", () => {
    window.conLatex = removeFirstPercent(window.conLatex);
    document.getElementById('constants').innerHTML = window.conLatex;
    MathJax.typeset();
});

document.getElementById("evalButton").addEventListener("click", () => {
    window.evalLatex = removeFirstPercent(window.evalLatex);
    document.getElementById('evaluate').innerHTML = window.evalLatex;
    MathJax.typeset();
});

document.getElementById("depthButton").addEventListener("click", () => {
    window.depthLatex = removeFirstPercent(window.depthLatex);
    document.getElementById('depth').innerHTML = window.depthLatex;
    MathJax.typeset();

});
