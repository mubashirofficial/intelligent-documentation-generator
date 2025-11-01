import dotenv from 'dotenv';
dotenv.config();
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class AIService {
  async generateDocumentation(node: any, language: string): Promise<string> {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: `You are a technical writer and educator who creates crystal-clear documentation that anyone can understand. Your goal is to explain code in simple, everyday language that even non-technical people can grasp.

          Follow these guidelines:
          - Use plain English, avoid technical jargon
          - Explain concepts like you're teaching a beginner
          - Focus on what the code DOES, not just how it works
          - Be concise but thorough`
          },
          {
            role: 'user',
            content: `Please create beginner-friendly documentation for this ${language} code:

          **CODE:**
          \`\`\`${language}
          ${node.code}
          \`\`\`

          **Please provide documentation in this exact structure:**

          1. **Simple Description**: One sentence explaining what this does in plain English

          2. **What It Does**: 2-3 sentences explaining the purpose in everyday terms

          3. **Inputs**: 
            - For each input: [Name] - Simple explanation of what it should be

          4. **Output**: What the code returns and when you'd use it

          **Important**: Write for someone who has never coded before. Use simple, clear language.`
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
      });
      console.log(completion);

      return completion.choices[0]?.message?.content || 'Documentation generated.';
    } catch (error) {
      console.error('AI error:', error);
      return `${node.type} ${node.name}: Implementation details.`;
    }
  }

  // New method: Generate documentation for entire code file
  async generateFileDocumentation(code: string, fileName: string, language: string): Promise<string> {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: `
              You are a senior software architect and technical documentation expert.
              Your task is to analyze any given source code and produce comprehensive documentation.
              
              **CRITICAL: You MUST follow this exact format structure. Do not deviate from these headers:**

              # Technical Documentation and Code Review for [FileName/ModuleName]

              ---

              ## 1. Technical Documentation

              ### Overview and Purpose
              [Write overview here]

              ### Architecture and Components
              [Write architecture details here]

              ### Data Structures / Interfaces
              [Write data structures here]

              ### Lifecycle or Execution Flow
              [Write lifecycle details here]

              ### Feature Details and Behaviors
              [Write feature details here]

              ### Limitations, Assumptions, and Edge Cases
              [Write limitations here]

              ### Integration and Usage Notes
              [Write integration notes here]

              ### Potential Test Coverage Ideas
              [Write test coverage ideas here]

              ---

              ## 2. Code Review Report

              ### Strengths and Good Design Choices
              [Write strengths here]

              ### Problems, Bugs, or Anti-Patterns
              [Write problems here]

              ### Security or Performance Issues
              [Write security/performance issues here]

              ### Maintainability, Readability, and Extensibility Comments
              [Write maintainability comments here]

              ### Suggested Refactors or Improvements
              [Write suggestions here]

              ### Concrete Code Fix Snippets
              [Write code fixes here with proper code blocks using \`\`\`language syntax]

              ---

              # Summary
              [Write a brief summary]

              **IMPORTANT FORMATTING RULES:**
              - Use exactly "## 1. Technical Documentation" as the first main section header
              - Use exactly "## 2. Code Review Report" as the second main section header
              - Use ### for subsection headers within each main section
              - Use \`\`\`language for all code blocks with the appropriate language (csharp, typescript, javascript, python, java, etc.)
              - Be specific, concise, and analytical
              - Use clear language like a senior engineer writing a review document
              - Analyze the code regardless of programming language - adapt your analysis to the language's conventions
            `
          },
          {
            role: 'user',
            content: `Generate a full technical documentation and code review for the following ${language} code file (${fileName}):\n\n\`\`\`${language}\n${code}\n\`\`\`
            
            Follow the exact format structure specified in the system prompt. Ensure you use "## 1. Technical Documentation" and "## 2. Code Review Report" as the main section headers.`
          }
        ],
        temperature: 0.3,
        max_tokens: 4000,
      });
      console.log('File documentation completion:', completion);

      return completion.choices[0]?.message?.content || 'Documentation generated.';
    } catch (error) {
      console.error('AI error:', error);
      return `Documentation for ${fileName}: Implementation details.`;
    }
  }

  async answerQuestion(question: string, context: string): Promise<string> {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful code assistant.',
          },
          {
            role: 'user',
            content: `Context:\n${context}\n\nQuestion: ${question}`,
          },
        ],
        temperature: 0.5,
        max_tokens: 500,
      });

      return completion.choices[0]?.message?.content || 'No answer available.';
    } catch (error) {
      console.error('AI error:', error);
      return 'Sorry, there was an error.';
    }
  }
}

export default new AIService();
