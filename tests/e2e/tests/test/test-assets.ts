import { writeMultipleFiles } from '../../utils/fs';
import { sr } from '../../utils/process';
import { updateJsonFile } from '../../utils/project';
import { expectToFail } from '../../utils/utils';
import { stripIndent } from 'common-tags';

// Make sure asset files are served
export default function () {
  return Promise.resolve()
    .then(() => writeMultipleFiles({
      'src/assets/file.txt': 'assets-folder-content',
      'src/file.txt': 'file-content',
      // Not using `async()` in tests as it seemed to swallow `fetch()` errors
      'src/app/app.component.spec.ts': stripIndent`
        describe('Test Runner', () => {
          const fetch = global['fetch'];
          it('should serve files in assets folder', (done) => {
            fetch('/assets/file.txt')
              .then(response => response.text())
              .then(fileText => {
                expect(fileText).toMatch('assets-folder-content');
                done();
              });
          });
          it('should serve files explicitly added to assets array', (done) => {
            fetch('/file.txt')
              .then(response => response.text())
              .then(fileText => {
                expect(fileText).toMatch('file-content');
                done();
              });
          });
        });
      `
    }))
    // Test failure condition (no assets in .speedray-cli.json)
    .then(() => updateJsonFile('.speedray-cli.json', configJson => {
      const app = configJson['apps'][0];
      app['assets'] = [];
    }))
    .then(() => expectToFail(() => sr('test', '--single-run'),
      'Should fail because the assets to serve were not in the Speedray CLI config'))
    // Test passing condition (assets are included)
    .then(() => updateJsonFile('.speedray-cli.json', configJson => {
      const app = configJson['apps'][0];
      app['assets'] = ['assets', 'file.txt'];
    }))
    .then(() => sr('test', '--single-run'));
}
