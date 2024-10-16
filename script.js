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

    if (task === 0 && !document.getElementById('treeHeading1')) {
        const heading1 = document.createElement('h2');
        heading1.innerText = "Strom";
        heading1.id = 'treeHeading1';  // Add an id to prevent duplicate headings
        document.getElementById('visualization').insertAdjacentElement('beforebegin', heading1);
    } else if (task === 1 && !document.getElementById('treeHeading2')) {
        const heading2 = document.createElement('h2');
        heading2.innerText = "Evaluovaný strom";
        heading2.id = 'treeHeading2';  // Add an id to prevent duplicate headings
        document.getElementById('visualization2').insertAdjacentElement('beforebegin', heading2);
    }

    const title = document.createElement('h3');
    if(task === 0 ){
        title.innerText = `${node.type} ∈ Term       (${node.desc})`;
    } else {
        title.innerText = `${node.type}`;
    }
    if(task === 1){
    // Add evaluated value next to the type
    let evaluatedValue;
    try {
        evaluatedValue = evaluate(node);  // Call the evaluate function to get the result
    } catch (e) {
        evaluatedValue = 'Error';  // Handle any evaluation errors gracefully
    }

    const evalSpan = document.createElement('span');
    evalSpan.innerText = ` -> ${evaluatedValue}`;
    evalSpan.style.color = 'green';  // Make it visually distinct by using green color

    // Append title and evaluation to div
    title.appendChild(evalSpan);

    }


    div.appendChild(title);

    // Create a container for children to lay them out vertically
    const childrenDiv = document.createElement('div');
    childrenDiv.classList.add('children');

    // Add child nodes to the container
    if (node.argument) {
        childrenDiv.appendChild(createNode(node.argument));
    }

    if (node.condition) {
        childrenDiv.appendChild(createNode(node.condition));
    }

    if (node.then) {
        childrenDiv.appendChild(createNode(node.then));
    }

    if (node.else) {
        childrenDiv.appendChild(createNode(node.else));
    }

    // Insert the children above the parent node
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

let task = 0;
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

        // Extract the inner expression between the parentheses
        const innerExpression = expression.slice(1, closingParenIdx);
        if(task === 1){
            // Create a tree node for the bracketed expression
            return createTree(innerExpression); // Recursively evaluate the inner expression
        } else {
            const tree = {
                type: expression,
                desc: "brack",
                argument: createTree(innerExpression)
            };
            return tree;
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
        const sizeCalculation = `${currentLevelString} + ${size}`;
        output += `<tr><td>= ${sizeCalculation}</td></tr>`; // Add to the table

        // Update the total size count
        size += currentLevelSize;
        
        // Move to the next level
        queue = nextQueue;
    }

    // Final output with total size
    output += `<tr><td>= ${size}</td></tr>`;
    
    // Write the output to the div
    document.getElementById("size").innerHTML = output + "</table>"; // Close the table
}

function conCount(tree) {
    // Initialize a queue with the root node
    let queue = [tree];
    let output = "<table border='1' style='border-collapse: collapse; width: 100%;'><tr><th>Kalkulácia počtu konštánt</th></tr>"; // Initialize the table
    let constants = [];

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
        output += `<tr><td>= ${constantCalculation}</td></tr>`; // Add to the table
        for (let i = 0; i < newConstants.length; i++) {
            constants.push(newConstants[i]);
        }
        // Move to the next level
        queue = nextQueue;
    }

    // Final output with unique constants
    const uniqueConstants = Array.from(new Set(constants)); // To ensure unique constants in final output
    const finalConstantString = uniqueConstants.length > 0 ? `{${uniqueConstants.join(',')}}` : '{}';
    output += `<tr><td>= ${finalConstantString}</td></tr>`; // Final unique constants

    // Write the output to the div
    document.getElementById("constants").innerHTML = output + "</table>"; // Close the table
}

function evaluate(tree) {
    if (!tree) return null;

    // Base cases for constants
    if (tree.type === "0") return 0;
    if (tree.type === "true") return true;
    if (tree.type === "false") return false;

    // Handle 'succ'
    if (tree.type.startsWith("succ")) {
        const evaluatedArgument = evaluate(tree.argument);
        if (typeof evaluatedArgument !== 'number') {
            return "Error";  // Return "Error" instead of throwing an error
        }
        return evaluatedArgument + 1; // Successor increases number by 1
    }

    // Handle 'pred'
    if (tree.type.startsWith("pred")) {
        const evaluatedArgument = evaluate(tree.argument);
        if (typeof evaluatedArgument !== 'number') {
            return "Error";  // Return "Error" instead of throwing an error
        }
        return Math.max(evaluatedArgument - 1, 0); // Predecessor decreases number but keeps it >= 0
    }

    // Handle 'iszero'
    if (tree.type.startsWith("iszero")) {
        const evaluatedArgument = evaluate(tree.argument);
        if (typeof evaluatedArgument !== 'number') {
            return "Error";  // Return "Error" instead of throwing an error
        }
        return evaluatedArgument === 0; // Returns true if argument is zero
    }

    // Handle 'if'
    if (tree.type.startsWith("if")) {
        const condition = evaluate(tree.condition);
        if (condition === "Error") return "Error";  // Propagate "Error" if the condition has an error
        if (condition) {
            const thenResult = evaluate(tree.then);
            return thenResult === "Error" ? "Error" : thenResult;  // Propagate "Error" from 'then' branch
        } else {
            const elseResult = evaluate(tree.else);
            return elseResult === "Error" ? "Error" : elseResult;  // Propagate "Error" from 'else' branch
        }
    }

    // If none of the above matches, return "Error"
    return "Error";
}

function evaluateTreeFromBottom(tree) {
    if (!tree) return null;

    // A queue for level order traversal
    const queue = [tree];

    // Use a map to track the original string representation for each node
    const nodeMap = new Map();

    // Initialize node map with original tree structure
    const initializeNodeMap = (node) => {
        if (!node) return;
        nodeMap.set(node, node.type);
        initializeNodeMap(node.argument);
        initializeNodeMap(node.condition);
        initializeNodeMap(node.then);
        initializeNodeMap(node.else);
    };
    initializeNodeMap(tree);

    while (queue.length > 0) {
        const currentNode = queue.shift(); // Get the next node

        // Evaluate child nodes first
        if (currentNode.argument) queue.push(currentNode.argument);
        if (currentNode.condition) queue.push(currentNode.condition);
        if (currentNode.then) queue.push(currentNode.then);
        if (currentNode.else) queue.push(currentNode.else);

        // Evaluate the current node
        const evaluatedResult = evaluate(currentNode);

        // Replace current node's string representation in its parent, excluding the root node
        if (currentNode !== tree) { // Do not update the root node's type
            const parentNode = getParentNode(tree, currentNode);
            if (parentNode) {
                const originalString = nodeMap.get(currentNode);
                const updatedString = evaluatedResult.toString();
                
                // Update the parent node's type string by replacing the original with the evaluated result
                parentNode.type = parentNode.type.replace(originalString, updatedString);
            }
        }
    }

    // After all nodes are evaluated, return the updated tree without changing the root
    return tree;
}

function getParentNode(tree, targetNode) {
    const queue = [tree];

    while (queue.length > 0) {
        const currentNode = queue.shift();

        // Check for child nodes
        if (currentNode.argument === targetNode || currentNode.condition === targetNode ||
            currentNode.then === targetNode || currentNode.else === targetNode) {
            return currentNode; // Found the parent node
        }

        // Add child nodes to the queue
        if (currentNode.argument) queue.push(currentNode.argument);
        if (currentNode.condition) queue.push(currentNode.condition);
        if (currentNode.then) queue.push(currentNode.then);
        if (currentNode.else) queue.push(currentNode.else);
    }

    return null;
}

document.getElementById("drawTree").addEventListener("click", () => {
    const expression = document.getElementById("expressionInput").value.trim();
    const visualizationContainer = document.getElementById('visualization');
    const sizeContainer = document.getElementById('size');
    const conContainer = document.getElementById(`constants`);

    const visualizationContainer2 = document.getElementById('visualization2');

    task = 0;
    if (expression) {
        try {
            visualizationContainer.innerHTML = "";
            visualizationContainer2.innerHTML = "";
            const tokenizedExpression = tokenize(expression);
            const treeData = createTree(tokenizedExpression);
            const visualizationNode = createNode(treeData);
            visualizationContainer.appendChild(visualizationNode);

            task = 1;
            const treeDataNew = createTree(tokenizedExpression);
            sizeCount(treeDataNew);
            conCount(treeDataNew);
            const evaluatedTree = evaluateTreeFromBottom(treeDataNew);
            const visualizationNode2 = createNode(evaluatedTree);
            visualizationContainer2.appendChild(visualizationNode2);


        } catch (error) {
            alert("Please enter a valid expression!!!!");
            visualizationContainer.innerHTML = "";
            sizeContainer.innerHTML = "";
            conContainer.innerHTML = "";
            visualizationContainer2.innerHTML = "";

            const treeHeading1 = document.getElementById('treeHeading1');
            const treeHeading2 = document.getElementById('treeHeading2');
            if (treeHeading1) {
                treeHeading1.remove();
            }
            if (treeHeading2) {
                treeHeading2.remove();
            }
        }
    } else {
        alert("Please enter a valid expression.");
    }
});

document.getElementById("typingCheckbox").addEventListener("change", function() {
    const typeSelect = document.getElementById("typeSelect");
    
    if (this.checked) {
        typeSelect.style.display = "inline";  // Show the type selection when checkbox is checked
    } else {
        typeSelect.style.display = "none";    // Hide the type selection when checkbox is unchecked
    }
});