import { library } from '@fortawesome/fontawesome-svg-core';
import * as iconsRegular from '@fortawesome/free-regular-svg-icons';
import * as iconsSolid from '@fortawesome/free-solid-svg-icons';

// register all icons from font awesome
for (const key in iconsRegular) {
  //@ts-ignore
  const icon = iconsRegular[key];
  if (icon?.iconName) library.add(icon);
}

for (const key in iconsSolid) {
  //@ts-ignore
  const icon = iconsSolid[key];
  if (icon?.iconName) library.add(icon);
}
