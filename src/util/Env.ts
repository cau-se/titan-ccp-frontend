export default function env (name: string, defaultValue?: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (globalThis as any)?.env?.[name] || process.env[name] || defaultValue
}
