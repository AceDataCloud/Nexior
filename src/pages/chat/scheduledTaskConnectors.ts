import type { IConnectorCatalogItem } from '@/operators/connection';
import type {
  IAuthorizableMcpServer,
  IAuthorizableSkill,
  IScheduledTask,
  IScheduledTaskTemplateDefinition
} from '@/operators/scheduledTasks';

export interface ITaskConnectorIcon {
  identifier: string;
  name: string;
  icon_url: string;
}

/** Use saved bindings first, then the declared connections of authorized skills
 * and the template. The prompt itself is never parsed for connector names. */
export function taskConnectorIcons(
  task: IScheduledTask,
  skills: IAuthorizableSkill[],
  mcpServers: IAuthorizableMcpServer[],
  templates: IScheduledTaskTemplateDefinition[],
  catalog: IConnectorCatalogItem[]
): ITaskConnectorIcon[] {
  if (!catalog.length) return [];
  const byIdentifier = new Map(catalog.map((item) => [item.identifier.toLowerCase(), item]));
  const byAlias = new Map<string, IConnectorCatalogItem[]>();
  for (const item of catalog) {
    const aliases = [item.slug, item.acedata_service_alias, item.identifier.split('/').at(-1)];
    for (const alias of aliases) {
      if (!alias) continue;
      const key = alias.toLowerCase();
      const matches = byAlias.get(key) ?? [];
      if (!matches.includes(item)) matches.push(item);
      byAlias.set(key, matches);
    }
  }

  const declared = new Set<string>();
  for (const binding of task.unattended_policy?.connection_bindings ?? []) {
    declared.add(binding.connector_identifier);
  }
  const selectedSkills = new Set([...(task.unattended_policy?.allowed_skills ?? []), ...(task.template.skills ?? [])]);
  for (const skill of skills) {
    if (!selectedSkills.has(skill.slug)) continue;
    for (const required of skill.required_connections ?? []) declared.add(required);
  }
  const template = templates.find(
    (item) => item.id === task.template_source?.id && item.version === task.template_source.version
  );
  for (const required of template?.requirements.connections ?? []) declared.add(required);

  const selectedServers = new Set([
    ...(task.unattended_policy?.allowed_mcp_servers ?? []),
    ...(task.template.mcp_servers ?? [])
  ]);
  const serverUrls = new Set(
    mcpServers
      .filter((server) => selectedServers.has(server.slug))
      .map((server) => server.server_url.replace(/\/$/, '').toLowerCase())
  );
  for (const item of catalog) {
    if (
      item.connection_methods?.some(
        (method) =>
          !!method.execution.server_url && serverUrls.has(method.execution.server_url.replace(/\/$/, '').toLowerCase())
      )
    ) {
      declared.add(item.identifier);
    }
  }

  const resolved = new Map<string, ITaskConnectorIcon>();
  for (const value of declared) {
    const key = value.toLowerCase();
    const direct = byIdentifier.get(key);
    const candidates = direct ? [direct] : (byAlias.get(key) ?? []);
    // A bare alias shared by multiple connectors does not identify one icon,
    // but still has a meaningful label if no catalog match exists.
    if (candidates.length !== 1) {
      if (candidates.length === 0) {
        resolved.set(key, { identifier: key, name: value.split('/').at(-1) || value, icon_url: '' });
      }
      continue;
    }
    const item = candidates[0];
    resolved.set(item.identifier, {
      identifier: item.identifier,
      name: item.name,
      icon_url: item.icon_url
    });
  }
  return [...resolved.values()];
}
