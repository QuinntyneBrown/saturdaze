// Prose and raw-source imports resolved by the `asset/source` rules in main.ts.
declare module '*.md' {
  const content: string;
  export default content;
}

declare module '*?raw' {
  const content: string;
  export default content;
}
