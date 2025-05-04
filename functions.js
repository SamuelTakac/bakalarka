import {findClosingParenthesis, splitConditional} from './script.js';


export function sizeCount(tree) {
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

export function conCount(tree) {
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






// depth funkcie
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

export function depthCount(tree) {
    vypocetPomocny = 0;
    condition_nodes = [];
    first = true;
    let depth = calculateDepth(tree);
    return depth;
}



// evaluacia funkcie


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

export function evaluateExpression(expression) {
    let steps = [];
    let currentExpression = expression;
    function evaluateStep(expr) {
        expr = removeUnnecessaryParentheses(expr); // Apply before each evaluation step
    
        if (expr.includes("succ true") || expr.includes("succ false")) {
            return expr;
        }
    
        if (expr.includes("pred true") || expr.includes("pred false")) {
            return expr;
        }
        if (expr.includes('iszero true') || expr.includes('iszero false')) {
            return expr;
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
            let replacedExpr = expr.slice(0, ifIdx) + replacement + expr.slice(expr.indexOf(elsePart - 1),elsePart.length);
            replacedExpr = removeUnnecessaryParentheses(replacedExpr);
            // Remove any unnecessary outer parentheses that may have remained
            //return removeUnnecessaryParentheses2(replacedExpr);
            return replacedExpr;
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