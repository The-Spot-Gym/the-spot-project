// Type guard utilities for runtime type checking

import type { Profile, Message, Conversation } from '@/types';

/**
 * Type guard to check if a value is a valid Profile
 */
export function isProfile(value: unknown): value is Profile {
  if (!value || typeof value !== 'object') return false;
  
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.user_id === 'string' &&
    typeof obj.username === 'string' &&
    typeof obj.created_at === 'string' &&
    typeof obj.updated_at === 'string'
  );
}

/**
 * Type guard to check if a value is a valid Message
 */
export function isMessage(value: unknown): value is Message {
  if (!value || typeof value !== 'object') return false;
  
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.conversation_id === 'string' &&
    typeof obj.sender_id === 'string' &&
    typeof obj.content === 'string' &&
    typeof obj.created_at === 'string'
  );
}

/**
 * Type guard to check if a value is a valid Conversation
 */
export function isConversation(value: unknown): value is Conversation {
  if (!value || typeof value !== 'object') return false;
  
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.is_group === 'boolean' &&
    typeof obj.created_at === 'string' &&
    typeof obj.updated_at === 'string'
  );
}

/**
 * Type guard to check if an array contains only Profiles
 */
export function isProfileArray(value: unknown): value is Profile[] {
  return Array.isArray(value) && value.every(isProfile);
}

/**
 * Type guard to check if an array contains only Messages
 */
export function isMessageArray(value: unknown): value is Message[] {
  return Array.isArray(value) && value.every(isMessage);
}

/**
 * Safely parse a JSON value with type checking
 */
export function safeJsonParse<T>(
  value: string,
  typeGuard: (val: unknown) => val is T
): T | null {
  try {
    const parsed = JSON.parse(value);
    return typeGuard(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
