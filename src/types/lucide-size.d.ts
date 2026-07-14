declare module '@acedatacloud/core/icons/components' {
  type OriginalIcons = typeof import('../../node_modules/@acedatacloud/core/dist/icons/components');
  type FunctionalComponent<Props> = import('../../node_modules/vue').FunctionalComponent<Props>;
  type CssSizedIcon<Component> =
    Component extends FunctionalComponent<infer Props>
      ? FunctionalComponent<Omit<Props, 'size'> & { size?: string | number }>
      : Component;

  const icons: { [Name in keyof OriginalIcons]: CssSizedIcon<OriginalIcons[Name]> };
  export = icons;
}
