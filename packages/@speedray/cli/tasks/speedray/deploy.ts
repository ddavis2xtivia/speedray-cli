const opn = require('opn');
import * as path from 'path';
import { DeployTaskOptions } from '../../commands/deploy';
import { deploy } from '../../lib/speedray/deploy';

const Task = require('../../ember-cli/lib/models/task');
const LiveReload = require('../../lib/speedray/livereload');


export default Task.extend({
  run: function (runTaskOptions: DeployTaskOptions, rebuildDoneCb: any) {
    const JarTask = require('./jar').default;
    const project = this.cliProject;
    const packageOptions = require(path.resolve(project.root, 'package.json'));

    return new Promise((resolve, reject) => {
        const jarTask = new JarTask({
          cliProject: project,
          ui: this.ui
        });
        let self = this;
        if (runTaskOptions.watch) {
          let firsttime = true;
          let livereload = new LiveReload({
            portletName: packageOptions.name,
            ui: self.ui
          });
          livereload.start();
          jarTask.run(runTaskOptions, function rebuildDone(stats: any) {
            self.ui.writeLine('\nupdated jar\n');
            deploy(project, runTaskOptions).subscribe(results => {
              if (firsttime) {
                firsttime = false;
                opn('http://localhost:8080/');
              }
              if (rebuildDoneCb) {
                rebuildDoneCb(results);
              } else {
                self.ui.writeLine('\n' + results + '\n');
              }
              livereload.done(stats);
            }, error => {
              self.ui.writeError('\nAn error occured during the deployment:\n' + (error));
              reject(error);
            });
          }).catch((error: any) => {
            reject(error);
          });
        } else {
          jarTask.run(runTaskOptions).then(() => {
            deploy(project, runTaskOptions).subscribe(results => {
              self.ui.writeLine(results);
              resolve(results);
            }, error => {
              self.ui.writeError('\nAn error occured during the deployment:\n' + (error));
              reject(error);
            });
          }).catch((error: any) => {
            reject(error);
          });
      }
    });
  }
});
