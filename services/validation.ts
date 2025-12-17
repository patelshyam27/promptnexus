import { NewPromptInput, AIModel, PromptCategory } from '../types';

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export const validatePromptInput = (input: NewPromptInput): ValidationResult => {
  const errors: Record<string, string> = {};

  // Title Validation
  if (!input.title || input.title.trim().length < 3) {
    errors.title = 'Title must be at least 3 characters long.';
  }

  // Content Validation
  if (!input.content || input.content.trim().length < 10) {
    errors.content = 'Prompt content must be at least 10 characters long. Good prompts are usually longer!';
  }

  // Model Validation
  if (!input.model || !Object.values(AIModel).includes(input.model as AIModel)) {
    // If it's a custom model typed in, we might allow it, but let's enforce selection for now or check length
    if (!input.model || input.model.trim().length < 2) {
       errors.model = 'Please select or enter a valid AI model.';
    }
  }

  // Category Validation
  if (!input.category || !Object.values(PromptCategory).includes(input.category)) {
    errors.category = 'Please select a valid category.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};
