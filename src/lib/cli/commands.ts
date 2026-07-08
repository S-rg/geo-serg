import type { CommandDef, ParsedCommand } from '$lib/types';

const registry = new Map<string, CommandDef>();

export function registerCommand(cmd: CommandDef): void {
  for (const alias of cmd.name) {
    if (registry.has(alias)) {
      console.warn(`Command alias "${alias}" is already registered — overwriting.`);
    }
    registry.set(alias, cmd);
  }
}

export function unregisterCommand(cmd: CommandDef | string): void {
  const aliases = typeof cmd === 'string' ? [cmd] : cmd.name;
  for (const alias of aliases) {
    registry.delete(alias);
  }
}

export function runCommand(name: string, args: string[]): boolean {
  const cmd = registry.get(name);
  if (!cmd) return false;
  cmd.handler(args);
  return true;
}

export function listCommands(): CommandDef[] {
  return [...new Set(registry.values())];
}

export function parseCommand(input: string): ParsedCommand {
  const parts = input.trim().split(/\s+/);
  const name = parts[0];
  const args = parts.slice(1);
  return { name, args };
}