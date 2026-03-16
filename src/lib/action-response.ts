export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function wrapAction<T>(fn: () => Promise<T>): Promise<ActionResponse<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
    };
  }
}
