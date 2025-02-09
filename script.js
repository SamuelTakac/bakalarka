function tokenize(expression) {
    // Remove whitespaces
    const strWithoutWhitespace = expression.replace(/\s+/g, '');
    
    // List of known keywords
    const keywords = ["if", "iszero", "true", "false", "then", "else", "succ", "pred", "0", "(", ")"];
    
    // Initialize an empty list to store the matched words
    const result = [];
    
    // Start from the beginning of the string
    let i = 0;
    while (i < strWithoutWhitespace.length) {
        let matched = false;
        // Try to match any keyword from the list
        for (const word of keywords) {
            if (strWithoutWhitespace.startsWith(word, i)) {
                result.push(word);  // Add the matched word to the result
                i += word.length;  // Move the index past the matched word
                matched = true;
                break;
            }
        }
        if (!matched) {
            throw new Error(`Unknown token starting at index ${i}`);
        }
    }

    // Return the matched tokens as a space-separated string
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

function createNode(node) {
    const div = document.createElement('div');
    div.classList.add('node');
    if (!document.getElementById('treeHeading1')) {
        const heading1 = document.createElement('h2');
        heading1.innerText = "Strom";
        heading1.id = 'treeHeading1';  // Add an id to prevent duplicate headings
        document.getElementById('visualization').insertAdjacentElement('beforebegin', heading1);
    }

    const title = document.createElement('h3');
    if (node.error) {
        title.innerHTML = `${node.type} : <span style='color: red'>${node.typing}</span>`;
    } else {
        typingCheckbox.checked ? title.innerText = `${node.type} : ${node.typing}` : title.innerText = `${node.type} ∈ Term (${node.desc})`;
    }
    div.appendChild(title);

    const childrenDiv = document.createElement('div');
    childrenDiv.classList.add('children');
    if (node.argument) childrenDiv.appendChild(createNode(node.argument));
    if (node.condition) childrenDiv.appendChild(createNode(node.condition));
    if (node.then) childrenDiv.appendChild(createNode(node.then));
    if (node.else) childrenDiv.appendChild(createNode(node.else));
    
    div.insertBefore(childrenDiv, title);
    
    return div;
}

function findClosingParenthesis(expr, startIdx) {
    let depth = 0;
    for (let i = startIdx; i < expr.length; i++) {
        if (expr[i] === '(') {
            depth++;
        } else if (expr[i] === ')') {
            depth--;
            if (depth === 0) {
                // Check for any characters after the closing parenthesis
                if (i < expr.length - 1) {
                    throw new Error("Invalid expression: unexpected characters after closing parenthesis.");
                }
                return i; // Found the matching closing parenthesis
            }
        }
    }
    throw new Error("Mismatched parentheses");
}

let start;
let start_i = 0;
function createTree(expression) {
    // Base case: if the expression is empty
    if (!expression) {
        return null;
    }

    // Strip leading and trailing whitespace
    expression = expression.trim();

    // If the expression starts with parentheses, evaluate the contents inside
    if (expression.startsWith("(")) {
        // Find the position of the matching closing parenthesis
        const closingParenIdx = findClosingParenthesis(expression, 0);
        const innerExpression = expression.slice(1, closingParenIdx);
        return createTree(innerExpression); // Recursively evaluate the inner expression
    } else {
        if(start_i==0) {
        start = expression;
        start_i++;
        }
    }

    // Handle 'if' statements
    if (expression.startsWith("if")) {
        const { ifPart, thenPart, elsePart } = splitConditional(expression);
        const tree = {
            desc: "if",
            type: expression,
            condition: createTree(ifPart),
            then: createTree(thenPart),
            else: createTree(elsePart),
        };
        return tree;
    }

    // Handle 'succ' and 'pred'
    if (expression.startsWith("succ")) {
        const nextSegment = expression.slice(5).trim();
        const nextChar = nextSegment.charAt(0);
        if(nextChar === "") throw new Error();
       /* // Check if the next character is '(', '0', or if the next word is "true" or "false"
        if (nextChar !== '(' && nextChar !== '0' && !nextSegment.startsWith("true") && !nextSegment.startsWith("false")) {
            throw new Error();
        }*/
        const tree = {
            type: expression,
            desc: "succ",
            argument: createTree(expression.slice(5).trim())
        };
        return tree;
    }

    if (expression.startsWith("pred")) {
        const nextSegment = expression.slice(5).trim();
        const nextChar = nextSegment.charAt(0);
        if(nextChar === "") throw new Error();
        // Check if the next character is '(', '0', or if the next word is "true" or "false"
        /*if (nextChar !== '(' && nextChar !== '0' && !nextSegment.startsWith("true") && !nextSegment.startsWith("false")) {
            throw new Error();
        }*/
        const tree = {
            type: expression,
            desc: "pred",
            argument: createTree(expression.slice(5).trim())
        };
        return tree;
    }

    if (expression.startsWith("iszero")) {
        const nextSegment = expression.slice(7).trim();
        const nextChar = nextSegment.charAt(0);
        if(nextChar === "") throw new Error();
        /*// Check if the next character is '(', '0', or if the next word is "true" or "false"
        if (nextChar !== '(' && nextChar !== '0' && !nextSegment.startsWith("true") && !nextSegment.startsWith("false")) {
            throw new Error();
        }*/
        const tree = {
            type: expression,
            desc: "iszero",
            argument: createTree(expression.slice(7).trim())
        };
        return tree;
    }

    // Handle literals (true, false, 0)
    if (expression === "true") {
        return { type: "true", desc: "true"};
    }

    if (expression === "false") {
        return { type: "false", desc: "false"};
    }

    if (expression === "0") {
        return { type: "0", desc: "0"};
    }

    // If none of the above matches, throw an error
    throw new Error(`Invalid expression: ${expression}`);
}

function createTreeWithTypes(expression, expectedType) {
    if (!expression) return null;
    expression = expression.trim();

    if (expression.startsWith("(")) {
        const closingParenIdx = findClosingParenthesis(expression, 0);
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

    throw new Error(`Invalid expression: ${expression}`);
}

function sizeCount(tree) {
    // Initialize a queue with the root node
    let queue = [tree];
    let size = 0;
    let output = "<table border='1' style='border-collapse: collapse; width: 100%;'><tr><th>Kalkulácia veľkosti</th></tr>"; // Initialize the table

    while (queue.length > 0) {
        const currentLevel = [];
        const nextQueue = [];
        let currentLevelSize = 0;

        // Process each node at the current level
        queue.forEach((node) => {
            currentLevel.push(`Size(${node.type})`);
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
        output += `<tr><td>${size === 0 ? sizeCalculation : `= ${sizeCalculation}`}</td></tr>`;
            
        // Update the total size count
        size += currentLevelSize;
        
        // Move to the next level
        queue = nextQueue;
    }

    // Final output with total size
    output += `<tr style='color: red'><td>= ${size}</td></tr>`;
    
    // Write the output to the div
    document.getElementById("size").innerHTML = output + "</table>"; // Close the table
}

function conCount(tree) {
    // Initialize a queue with the root node
    let queue = [tree];
    let output = "<table border='1' style='border-collapse: collapse; width: 100%;'><tr><th>Kalkulácia počtu konštánt</th></tr>"; // Initialize the table
    let constants = [];
    let count = 0;
    while (queue.length > 0) {
        const currentLevel = [];
        const nextQueue = [];
        let newConstants = [];
        // Process each node at the current level
        queue.forEach((node) => {
            currentLevel.push(`Con(${node.type})`);

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
        const constantsString = constants.length > 0 ? constants.map(constant => `∪ {${constant}}`).join(' ') : '';

        // Combine current level calculation with constants
        const constantCalculation = `${currentLevelString}${constantsString}`;
        output += `<tr><td>${count === 0 ? constantCalculation : `= ${constantCalculation}`}</td></tr>`;
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
    output += `<tr style='color: red'><td>= ${finalConstantString}</td></tr>`; // Final unique constants

    // Write the output to the div
    document.getElementById("constants").innerHTML = output + "</table>"; // Close the table
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
                const closingIdx = findClosingParenthesis(expr, i);
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

let condition_nodes = [];
let first = true;
function calculateConditionalDepth(node_condition, node_then, node_else, depths, closed, depth, depth_output) {
    let firstDepth, secondDepth, thirdDepth;
    firstDepth = updateDepth(node_condition, 0, depths, closed);
    secondDepth = updateDepth(node_then, 1, depths, closed);
    thirdDepth = updateDepth(node_else, 2, depths, closed);

    depth_output.push(`<tr><td>= max(${firstDepth}, ${secondDepth}, ${thirdDepth})${depth !== 0 ? ' + ' + depth : ''}</td></tr>`);

    if (node_condition.argument) {
        depths[0]++;
        return calculateConditionalDepth(node_condition.argument, node_then, node_else, depths, closed, depth, depth_output);
    } else if (!node_condition.argument) {
        if (!closed[0]) {
            depths[0]++;
            closed[0] = true;
            firstDepth = `${depths[0]}`;
            depth_output.push(`<tr><td>= max(${firstDepth}, ${secondDepth}, ${thirdDepth})${depth !== 0 ? ' + ' + depth : ''}</td></tr>`);

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
            depth_output.push(`<tr><td>= max(${firstDepth}, ${secondDepth}, ${thirdDepth})${depth !== 0 ? ' + ' + depth : ''}</td></tr>`);

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
            depth_output.push(`<tr><td>= max(${firstDepth}, ${secondDepth}, ${thirdDepth})${depth !== 0 ? ' + ' + depth : ''}</td></tr>`);

        }

        const biggest = Math.max(...depths);
        if (depth !== 0) {
            depth_output.push(`<tr><td>= ${biggest} + ${depth}</td></tr>`);
            depth_output.push(first ? `<tr style='color: red'><td>= ${biggest + depth}</td></tr>` : `<tr><td>= ${biggest + depth}</td></tr>`);
        } else {
            depth_output.push(first ? `<tr style='color: red'><td>= ${biggest}</td></tr>` : `<tr><td>= ${biggest}</td></tr>`);
        }        

        if (first) {
            first = false;
            const colors = ["blue", "green", "purple", "orange", "brown", "pink", "teal", "cyan", "lime"]; // Expand if needed
            const typeColors = {}; // Store assigned colors for each unique type
            let colorIndex = 0;

            // Collect all unique conditionNode.type values first
            const conditionTypes = new Set();

            for (let conditionNode of condition_nodes) {
                if (!typeColors[conditionNode.type]) {
                    typeColors[conditionNode.type] = colors[colorIndex % colors.length];
                    colorIndex++;
                }
                conditionTypes.add(conditionNode.type);
            }

            // Modify depth_output[0] only once, applying **all** colors
            let firstLine = depth_output[0]; // Keep original first line
            for (let type of conditionTypes) {
                const color = typeColors[type];
                if (firstLine.includes(`${type}`)) {
                    firstLine = firstLine.replace(`${type}`,`<span style="color:${color}">${type}</span>`);
                }
            }
            depth_output[0] = firstLine; // Update first line after all replacements

            // Process each conditionNode as before
            for (let conditionNode of condition_nodes) {
                depth_output.push(`<tr><td> </td></tr>`); 
                const node_condition = conditionNode.condition;
                const node_then = conditionNode.then;
                const node_else = conditionNode.else;
            
                // Push the depth with color-coded condition type
                depth_output.push(`<tr><td>depth(<span style="color:${typeColors[conditionNode.type]}">${conditionNode.type}</span>)</td></tr>`);
                /* depth_output.push(`<tr><td>depth(${conditionNode.type})</td></tr>`); */

                calculateConditionalDepth(node_condition, node_then, node_else, [0, 0, 0], [false, false, false], 0, depth_output);
            }
        }
    }
    return depth_output;
} 

function updateDepth(node, index, depths, closed) {
    if (node.condition && !closed[index]) {
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
    
function calculateDepth(node, depth = 0, depth_output = []) {
    while (node) {
        depth_output.push(`<tr><td>${depth === 0 ? `depth(${node.type})` : `= depth(${node.type}) + ${depth}`}</td></tr>\n`);
        depth++;

        if (node.condition) {
            let depths = [0, 0, 0];
            let closed = [false, false, false];

            return calculateConditionalDepth(node.condition, node.then, node.else, depths, closed, depth, depth_output);
        }

        node = node.argument;
        if (!node) {
            break;
        }
    }
    const lastEntry = depth_output[depth_output.length - 1];
    if (lastEntry.includes("= depth(")) {
        depth_output.push(`<tr><td>= ${depth}</td></tr>\n`);
    }
    return depth_output;
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
        // Rule for iszero(succ nv1) -> false for any succ
        if (expr.match(/iszero \( succ /)) {
            return expr.replace(/iszero \( succ /, 'false');
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
            let replacedExpr = expr.slice(0, ifIdx) + replacement + expr.slice(expr.indexOf(elsePart) + elsePart.length);
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

    let tableHTML = '<table border="1" style="border-collapse: collapse; width: 100%;">';
    tableHTML += '<tr><th>Evaluácia termu</th></tr>';
    let i = 0;
    steps.forEach((step, index) => {
        if (index < steps.length - 1) {
            if (i == 0) {
                tableHTML += `<tr><td>${step}</td></tr>`;
                i++;
            } else {
                tableHTML += `<tr><td>-> ${step}</td></tr>`;
            }
        }
    });
    tableHTML += '</table>';
    document.getElementById('evaluate').innerHTML = tableHTML;
}

document.getElementById("typingCheckbox").addEventListener("change", function() {
    const typeSelect = document.getElementById("typeSelect");
    
    if (this.checked) {
        typeSelect.style.display = "inline";  // Show the type selection when checkbox is checked
    } else {
        typeSelect.style.display = "none";    // Hide the type selection when checkbox is unchecked
    }
});

document.getElementById("drawTree").addEventListener("click", () => {
    const expression = document.getElementById("expressionInput").value.trim();
    const visualizationContainer = document.getElementById('visualization');
    const sizeContainer = document.getElementById('size');
    const conContainer = document.getElementById(`constants`);
    const depthContainer = document.getElementById(`depth`);
    const evaluationContainer = document.getElementById('evaluate');

    if (expression) {
        try {
            visualizationContainer.innerHTML = "";
            const tokenizedExpression = tokenize(expression);
            if (document.getElementById("typingCheckbox").checked) {
                const expectedType = document.getElementById("typeSelect").value;
                treeData = createTreeWithTypes(tokenizedExpression, expectedType);
            } else {
                treeData = createTree(tokenizedExpression);
            }
            const visualizationNode = createNode(treeData);
            visualizationContainer.appendChild(visualizationNode);
            treeDataNew = createTree(tokenizedExpression);
            sizeCount(treeDataNew);
            conCount(treeDataNew);

            condition_nodes = [];
            first = true;
            const depth_output = calculateDepth(treeDataNew);
            depthContainer.innerHTML = `<table><tr><th>Kalkulácia hĺbky</th></tr>${depth_output.join("")}</table>`;

            evaluateExpression(tokenize(start));
        } catch (error) {
            alert("Please enter a valid expression!!!!");
            visualizationContainer.innerHTML = "";
            sizeContainer.innerHTML = "";
            conContainer.innerHTML = "";
            depthContainer.innerHTML = "";
            evaluationContainer.innerHTML = "";
        }
    } else {
        alert("Please enter a valid expression.");
    }
});