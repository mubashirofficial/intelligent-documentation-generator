import Parser from 'tree-sitter';
import TypeScript from 'tree-sitter-typescript';
import JavaScript from 'tree-sitter-javascript';
import Python from 'tree-sitter-python';

export class TreeSitterParser {
  private parser: Parser;

  constructor() {
    this.parser = new Parser();
  }

  parse(code: string, fileName: string) {
    const language = this.detectLanguage(fileName);
    this.setLanguage(language);

    const tree = this.parser.parse(code);
    const functions: any[] = [];
    const classes: any[] = [];

    this.traverseNode(tree.rootNode, code, language, functions, classes);

    return { language, functions, classes };
  }

  private detectLanguage(fileName: string): 'typescript' | 'javascript' | 'python' {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'ts' || ext === 'tsx') return 'typescript';
    if (ext === 'py') return 'python';
    return 'javascript';
  }

  private setLanguage(language: string) {
    switch (language) {
      case 'typescript':
        this.parser.setLanguage(TypeScript.typescript);
        break;
      case 'python':
        this.parser.setLanguage(Python);
        break;
      default:
        this.parser.setLanguage(JavaScript);
    }
  }

  private traverseNode(node: Parser.SyntaxNode, code: string, language: string, functions: any[], classes: any[]) {
    if (node.type.includes('function') || node.type === 'function_definition') {
      const name = this.extractName(node, code);
      if (name) {
        functions.push({
          type: 'function',
          name,
          startLine: node.startPosition.row + 1,
          endLine: node.endPosition.row + 1,
          code: code.substring(node.startIndex, node.endIndex),
        });
      }
    } else if (node.type.includes('class')) {
      const name = this.extractName(node, code);
      if (name) {
        classes.push({
          type: 'class',
          name,
          startLine: node.startPosition.row + 1,
          endLine: node.endPosition.row + 1,
          code: code.substring(node.startIndex, node.endIndex),
        });
      }
    }

    for (let i = 0; i < node.childCount; i++) {
      this.traverseNode(node.child(i)!, code, language, functions, classes);
    }
  }

  private extractName(node: Parser.SyntaxNode, code: string): string | null {
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child && (child.type === 'identifier' || child.type === 'property_identifier')) {
        return code.substring(child.startIndex, child.endIndex);
      }
    }
    return null;
  }
}

export default new TreeSitterParser();
