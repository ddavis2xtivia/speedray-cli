import { join } from 'path';
import { sr } from '../../../utils/process';
import { expectFileToMatch } from '../../../utils/fs';

export default function () {
  const modulePath = join('src', 'app', 'foo', 'foo.module.ts');

  return Promise.resolve()
    .then(() => sr('generate', 'module', 'foo'))
    .then(() => sr('generate', 'pipe', 'foo', '--no-flat'))
    .then(() => expectFileToMatch(modulePath, /import { FooPipe } from '.\/foo.pipe'/));
}
