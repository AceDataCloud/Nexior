import { library } from '@fortawesome/fontawesome-svg-core';
import * as icons from '@fortawesome/free-regular-svg-icons';

// register all icons from font awesome
for (const key in icons) {
  //@ts-ignore
  const icon = icons[key];
  if (icon?.iconName) library.add(icon);
}
