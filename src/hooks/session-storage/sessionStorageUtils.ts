/**
 * Create a string representation of the current state for session saving.
 * This helps in quickly comparing if the state has actually changed.
 */
export const createStateSnapshot = (
  step: string,
  text: string,
  chaptersJson: string,
  language: string,
  inProgress: string
): string => {
  return `${step}-${text.length}-${chaptersJson.length}-${language}-${inProgress}`;
};
