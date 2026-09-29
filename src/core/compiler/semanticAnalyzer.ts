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
  /** Set when this step reports a semantic error instead of a successful action. */
  isError?: boolean;
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

  /** Finds the innermost scope on the active stack that declares `name`. */
  function lookup(name: string): Scope | null {
    for (let i = activeScopeStack.length - 1; i >= 0; i--) {
      if (activeScopeStack[i].variables[name]) {
        return activeScopeStack[i];
      }
    }
    return null;
  }

  function pushError(line: number, action: string, description: string, scopeId: string, targetVariable?: string) {
    steps.push({
      stepIndex: steps.length,
      currentLine: line,
      action: `Error: ${action}`,
      description,
      activeScopeId: scopeId,
      activeScopeStack: cloneScopeStack(activeScopeStack),
      targetVariable,
      isError: true,
    });
  }

  /**
   * Resolves a right-hand-side operand to a value. Identifier references are looked up
   * through the scope chain; an undeclared reference emits an error step and returns null.
   */
  function resolveValue(raw: string, kind: 'number' | 'identifier', line: number): string | null {
    if (kind === 'number') return raw;
    const scope = lookup(raw);
    if (!scope) {
      pushError(
        line,
        `Undeclared '${raw}'`,
        `Use of undeclared identifier '${raw}'. It is not visible from ${activeScopeStack[activeScopeStack.length - 1].name}.`,
        activeScopeStack[activeScopeStack.length - 1].id,
        raw
      );
      return null;
    }
    return scope.variables[raw].value;
  }

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

        if (currentScope.variables[declNode.name]) {
          pushError(
            declNode.line,
            `Redeclaration of '${declNode.name}'`,
            `'${declNode.name}' is already declared in ${currentScope.name} (line ${currentScope.variables[declNode.name].declaredLine}). Redeclaration ignored.`,
            currentScope.id,
            declNode.name
          );
          continue;
        }

        const initValue = resolveValue(declNode.initValue, declNode.initKind, declNode.line);
        if (initValue === null) continue;

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
          value: initValue,
          declaredLine: declNode.line,
          isShadowing,
        };

        steps.push({
          stepIndex: steps.length,
          currentLine: declNode.line,
          action: `Declared '${declNode.name}' in ${currentScope.name}`,
          description: isShadowing
            ? `Declared '${declNode.name} = ${initValue}' in ${currentScope.name} (shadows '${declNode.name}' in parent scope).`
            : `Declared '${declNode.name} = ${initValue}' in ${currentScope.name}.`,
          activeScopeId: currentScope.id,
          activeScopeStack: cloneScopeStack(activeScopeStack),
          targetVariable: declNode.name,
        });
      } else if (node.type === 'AssignmentExpression') {
        const assignNode = node as AssignmentExpressionNode;
        const targetScope = lookup(assignNode.name);

        if (!targetScope) {
          const currentScope = activeScopeStack[activeScopeStack.length - 1];
          pushError(
            assignNode.line,
            `Undeclared '${assignNode.name}'`,
            `Cannot assign to '${assignNode.name}': it is not declared in any enclosing scope. Declare it with 'let' first.`,
            currentScope.id,
            assignNode.name
          );
          continue;
        }

        const value = resolveValue(assignNode.value, assignNode.valueKind, assignNode.line);
        if (value === null) continue;

        targetScope.variables[assignNode.name].value = value;
        steps.push({
          stepIndex: steps.length,
          currentLine: assignNode.line,
          action: `Assigned '${assignNode.name} = ${value}' in ${targetScope.name}`,
          description: `Updated variable '${assignNode.name}' value to ${value} in ${targetScope.name}.`,
          activeScopeId: targetScope.id,
          activeScopeStack: cloneScopeStack(activeScopeStack),
          targetVariable: assignNode.name,
        });
      }
    }
  }

  traverseNodes(ast.body);

  return steps;
}
