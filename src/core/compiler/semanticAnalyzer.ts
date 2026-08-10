import type {
  ProgramScopeNode,
  ScopeASTNode,
  BlockStatementNode,
  VariableDeclarationNode,
  AssignmentExpressionNode,
} from './scopeParser';

export interface SymbolVariable {
  name: string;
  type: string;
  value: string;
  declaredLine: number;
  isShadowing?: boolean;
}

export interface Scope {
  id: string;
  name: string;
  parentId: string | null;
  variables: Record<string, SymbolVariable>;
}

export interface ScopeExecutionStep {
  stepIndex: number;
  currentLine: number;
  action: string;
  description: string;
  activeScopeId: string;
  activeScopeStack: Scope[];
  targetVariable?: string;
}

/**
 * Deep copy helper for active scope stack snapshots.
 */
function cloneScopeStack(stack: Scope[]): Scope[] {
  return JSON.parse(JSON.stringify(stack));
}

/**
 * Pure function to analyze AST and generate execution snapshots for scope stack operations.
 */
export function analyzeScopes(ast: ProgramScopeNode): ScopeExecutionStep[] {
  const steps: ScopeExecutionStep[] = [];
  const activeScopeStack: Scope[] = [];
  let scopeCounter = 0;

  // Step 0: Initialize Global Scope
  const globalScope: Scope = {
    id: 'scope-0',
    name: 'Global Scope',
    parentId: null,
    variables: {},
  };
  activeScopeStack.push(globalScope);

  steps.push({
    stepIndex: 0,
    currentLine: ast.line || 1,
    action: 'Initialized Global Scope',
    description: 'Created Global Scope (Scope 0) at environment root.',
    activeScopeId: globalScope.id,
    activeScopeStack: cloneScopeStack(activeScopeStack),
  });

  function traverseNodes(nodes: ScopeASTNode[]) {
    for (const node of nodes) {
      if (node.type === 'BlockStatement') {
        const blockNode = node as BlockStatementNode;
        scopeCounter++;
        const parentScope = activeScopeStack[activeScopeStack.length - 1];
        const newScope: Scope = {
          id: `scope-${scopeCounter}`,
          name: `Scope ${scopeCounter}`,
          parentId: parentScope ? parentScope.id : null,
          variables: {},
        };

        activeScopeStack.push(newScope);

        steps.push({
          stepIndex: steps.length,
          currentLine: blockNode.line,
          action: `Pushed ${newScope.name}`,
          description: `Entered block on line ${blockNode.line}. Pushed ${newScope.name} onto stack.`,
          activeScopeId: newScope.id,
          activeScopeStack: cloneScopeStack(activeScopeStack),
        });

        // Traverse inner block statements
        traverseNodes(blockNode.body);

        // Exit block -> Pop scope
        const popped = activeScopeStack.pop();
        const currentTop = activeScopeStack[activeScopeStack.length - 1] || globalScope;

        steps.push({
          stepIndex: steps.length,
          currentLine: blockNode.endLine || blockNode.line,
          action: `Popped ${popped?.name || 'Scope'}`,
          description: `Exited block. Popped ${popped?.name} from active stack. Variables in this scope destroyed.`,
          activeScopeId: currentTop.id,
          activeScopeStack: cloneScopeStack(activeScopeStack),
        });
      } else if (node.type === 'VariableDeclaration') {
        const declNode = node as VariableDeclarationNode;
        const currentScope = activeScopeStack[activeScopeStack.length - 1];

        // Check if variable shadows an outer scope variable
        let isShadowing = false;
        for (let i = activeScopeStack.length - 2; i >= 0; i--) {
          if (activeScopeStack[i].variables[declNode.name]) {
            isShadowing = true;
            break;
          }
        }

        // Add to current scope dictionary
        currentScope.variables[declNode.name] = {
          name: declNode.name,
          type: declNode.varType || 'number',
          value: declNode.initValue,
          declaredLine: declNode.line,
          isShadowing,
        };

        steps.push({
          stepIndex: steps.length,
          currentLine: declNode.line,
          action: `Declared '${declNode.name}' in ${currentScope.name}`,
          description: isShadowing
            ? `Declared '${declNode.name} = ${declNode.initValue}' in ${currentScope.name} (shadows '${declNode.name}' in parent scope).`
            : `Declared '${declNode.name} = ${declNode.initValue}' in ${currentScope.name}.`,
          activeScopeId: currentScope.id,
          activeScopeStack: cloneScopeStack(activeScopeStack),
          targetVariable: declNode.name,
        });
      } else if (node.type === 'AssignmentExpression') {
        const assignNode = node as AssignmentExpressionNode;

        // Search active stack top-to-bottom for declaration scope
        let targetScope: Scope | null = null;
        for (let i = activeScopeStack.length - 1; i >= 0; i--) {
          if (activeScopeStack[i].variables[assignNode.name]) {
            targetScope = activeScopeStack[i];
            break;
          }
        }

        if (targetScope) {
          targetScope.variables[assignNode.name].value = assignNode.value;
          steps.push({
            stepIndex: steps.length,
            currentLine: assignNode.line,
            action: `Assigned '${assignNode.name} = ${assignNode.value}' in ${targetScope.name}`,
            description: `Updated variable '${assignNode.name}' value to ${assignNode.value} in ${targetScope.name}.`,
            activeScopeId: targetScope.id,
            activeScopeStack: cloneScopeStack(activeScopeStack),
            targetVariable: assignNode.name,
          });
        } else {
          // Undeclared assignment fallback into current top scope
          const currentScope = activeScopeStack[activeScopeStack.length - 1];
          currentScope.variables[assignNode.name] = {
            name: assignNode.name,
            type: 'number',
            value: assignNode.value,
            declaredLine: assignNode.line,
          };
          steps.push({
            stepIndex: steps.length,
            currentLine: assignNode.line,
            action: `Assigned '${assignNode.name} = ${assignNode.value}' (Implicit Decl)`,
            description: `Variable '${assignNode.name}' was assigned without prior declaration. Added to ${currentScope.name}.`,
            activeScopeId: currentScope.id,
            activeScopeStack: cloneScopeStack(activeScopeStack),
            targetVariable: assignNode.name,
          });
        }
      }
    }
  }

  traverseNodes(ast.body);

  return steps;
}
