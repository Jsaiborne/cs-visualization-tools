import type { ASTNode, TACInstruction } from '../../types/compiler';

export type { TACInstruction };

/**
 * Pure generator function that converts an Abstract Syntax Tree (AST)
 * into Intermediate Representation (IR) Three-Address Code (TAC).
 *
 * Performs a post-order traversal of the AST. For every BinaryExpressionNode,
 * generates a new temporary variable (e.g., t1, t2) and a corresponding TACInstruction,
 * while preserving original source character offset ranges [start:end].
 *
 * @param ast Root node of the AST or null if unparseable
 * @returns Array of linear TAC instructions
 */
export function generateTAC(ast: ASTNode | null): TACInstruction[] {
  if (!ast) return [];

  const instructions: TACInstruction[] = [];
  let tempCounter = 1;

  function traverse(node: ASTNode): string {
    if (node.type === 'Program') {
      return traverse(node.body);
    }

    if (node.type === 'NumericLiteral') {
      return node.raw ?? String(node.value);
    }

    if (node.type === 'Identifier') {
      return node.name;
    }

    if (node.type === 'BinaryExpression') {
      // Post-order traversal: visit children first
      const arg1 = traverse(node.left);
      const arg2 = traverse(node.right);
      const tempVar = `t${tempCounter++}`;

      instructions.push({
        op: node.operator,
        arg1,
        arg2,
        result: tempVar,
        originalRange: {
          start: node.start,
          end: node.end,
        },
      });

      return tempVar;
    }

    return '';
  }

  traverse(ast);
  return instructions;
}
