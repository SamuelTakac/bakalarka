import { zoom, full_screen } from '../UI/containersFunctionality.js';
import { sizeCount, conCount, depthCount, evaluateExpression} from '../term_functions/functions.js';


let type = null;
let unknownTokens = [];
function lexer(expression) {
    unknownTokens = [];

    const lowerCase = expression.toLowerCase();
    const keywords = ["if", "iszero", "true", "false", "then", "else", "succ", "pred", "0", ":", "bool", "nat", "?", "(", ")"];
    type = null;
    let result = [];
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
        throw new Error(`type`);
    }

    if (colonCount === 1) {
        if (
            len < 2 ||
            result[len - 2] !== ":" ||
            !["nat", "bool", "?"].includes(result[len - 1])
        ) {
            throw new Error(`type`);
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

function cleanBrackets(arr) {
    function removeOuterBrackets(expr) {
        if (expr.length >= 2 && expr[0] === '(' && expr[expr.length - 1] === ')') {
            let depth = 0;
            for (let i = 0; i < expr.length; i++) {
                if (expr[i] === '(') depth++;
                else if (expr[i] === ')') depth--;

                if (depth === 0 && i < expr.length - 1) return expr;
            }
            return expr.slice(1, expr.length - 1);
        }
        return expr;
    }

    function clean(expr) {
        expr = removeOuterBrackets(expr);

        const result = [];
        let i = 0;

        while (i < expr.length) {
            if (expr[i] === '(') {
                let depth = 1;
                let j = i + 1;
                while (j < expr.length && depth > 0) {
                    if (expr[j] === '(') depth++;
                    else if (expr[j] === ')') depth--;
                    j++;
                }
                const inner = clean(expr.slice(i + 1, j - 1));
                result.push('(');
                result.push(...inner);
                result.push(')');
                i = j;
            } else {
                result.push(expr[i]);
                i++;
            }
        }

        return removeOuterBrackets(result);
    }

    return clean(arr);
}

export function findClosingParenthesis(expr, startIdx, currentIndex, task) {
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

export function splitConditional(condition) {
    const stack = [];
    let ifIdx = condition.indexOf('if');
    let thenIdx = -1;
    let elseIdx = -1;

    for (let i = ifIdx + 2; i < condition.length; i++) {
        const char = condition[i];
        if (char === '(') stack.push('(');
        else if (char === ')') stack.pop();
        else if (condition.substring(i, i + 4) === 'then' && stack.length === 0) {
            thenIdx = i;
            break;
        }
    }

    for (let i = thenIdx + 4; i < condition.length; i++) {
        const char = condition[i];
        if (char === '(') stack.push('(');
        else if (char === ')') stack.pop();
        else if (condition.substring(i, i + 4) === 'else' && stack.length === 0) {
            elseIdx = i;
            break;
        }
    }

    const ifPart = condition.substring(ifIdx + 2, thenIdx).trim();
    const thenPart = condition.substring(thenIdx + 4, elseIdx).trim();
    const elsePart = condition.substring(elseIdx + 4).trim();

    return { ifPart, thenPart, elsePart };
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
        if(start_i==1) {
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
    
        let subTree = node.argument ? buildTree(node.argument, currentDepth + 1) : "";
    
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

function addPercentToRows(latexCode, x) {
    const lines = latexCode.split('\n');
    for (let i = x - 1; i < lines.length - 1; i++) {
      lines[i] = "%" + lines[i];
    }
    return lines.join('\n');
}

export function removeFirstPercent(text) {
    const index = text.indexOf('%');
    if (index !== -1) {
      return text.slice(0, index) + text.slice(index + 1);
    }
    return text;
}

export function displayTree(level){
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
        window.level = 1;
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
            let splitExpression = tokenizedExpression.split(" ");
            splitExpression = cleanBrackets(splitExpression);
            tokenizedExpression = splitExpression.join(" ");

            let treeDataNew = createTree(testParser, 0);

            testParser = testParser.split(" ");
            let splitTest = cleanBrackets(testParser);
            testParser = splitTest.join(" ");
            start_i++;
            treeDataNew = createTree(testParser, 0);

            if(type != null) {
                tokenizedExpression = tokenizedExpression.slice(0, tokenizedExpression.indexOf(":") - 1).trim();
            }
            displayTree(level);
            window.tree = visualizationContainer.innerHTML;
            sizeCount(treeDataNew);
            conCount(treeDataNew);
            depthContainer.innerHTML = `<p><br>\\begin{align}\n` + depthCount(treeDataNew).join("") + `\\end{align}</p>`;
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
            let highlighted = [];console.log(error);
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
            if (error.message === "type") {
                errorContainer.innerHTML = `Chyby : <br><br>Typová anotácia môže byť len jedna a na konci výrazu, v tvare ": nat",": bool" alebo ": ?"`;    
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