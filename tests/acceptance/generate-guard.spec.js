'use strict';

var fs = require('fs-extra');
var sr = require('../helpers/sr');
var existsSync = require('exists-sync');
var expect = require('chai').expect;
var path = require('path');
var tmp = require('../helpers/tmp');
var root = process.cwd();
var Promise = require('@speedray/cli/ember-cli/lib/ext/promise');
var SilentError = require('silent-error');
const denodeify = require('denodeify');

const readFile = denodeify(fs.readFile);

describe('Acceptance: sr generate guard', function () {
  beforeEach(function () {
    return tmp.setup('./tmp').then(function () {
      process.chdir('./tmp');
    }).then(function () {
      return sr(['new', 'foo', '--skip-install']);
    });
  });

  afterEach(function () {
    this.timeout(10000);

    return tmp.teardown('./tmp');
  });

  it('sr generate guard my-guard', function () {
    const appRoot = path.join(root, 'tmp/foo');
    const testPath = path.join(appRoot, 'src/app/my-guard.guard.ts');
    const testSpecPath = path.join(appRoot, 'src/app/my-guard.guard.spec.ts');
    const appModulePath = path.join(appRoot, 'src/app/app.module.ts');

    return sr(['generate', 'guard', 'my-guard'])
      .then(() => {
        expect(existsSync(testPath)).to.equal(true);
        expect(existsSync(testSpecPath)).to.equal(true);
      })
      .then(() => readFile(appModulePath, 'utf-8'))
      .then(content => {
        expect(content).not.to.matches(/import.*\MyGuardGuard\b.*from '.\/my-guard.guard';/);
        expect(content).not.to.matches(/providers:\s*\[MyGuardGuard\]/m);
      });
  });

  it('sr generate guard my-guard --no-spec', function () {
    const appRoot = path.join(root, 'tmp/foo');
    const testPath = path.join(appRoot, 'src/app/my-guard.guard.ts');
    const testSpecPath = path.join(appRoot, 'src/app/my-guard.guard.spec.ts');
    const appModulePath = path.join(appRoot, 'src/app/app.module.ts');

    return sr(['generate', 'guard', 'my-guard', '--no-spec'])
      .then(() => {
        expect(existsSync(testPath)).to.equal(true);
        expect(existsSync(testSpecPath)).to.equal(false);
      })
      .then(() => readFile(appModulePath, 'utf-8'))
      .then(content => {
        expect(content).not.to.matches(/import.*\MyGuardGuard\b.*from '.\/my-guard.guard';/);
        expect(content).not.to.matches(/providers:\s*\[MyGuardGuard\]/m);
      });
  });

  it('sr generate guard my-guard --module=app.module.ts', function () {
    const appRoot = path.join(root, 'tmp/foo');
    const testPath = path.join(appRoot, 'src/app/my-guard.guard.ts');
    const testSpecPath = path.join(appRoot, 'src/app/my-guard.guard.spec.ts');
    const appModulePath = path.join(appRoot, 'src/app/app.module.ts');

    return sr(['generate', 'guard', 'my-guard', '--module', 'app.module.ts'])
      .then(() => {
        expect(existsSync(testPath)).to.equal(true);
        expect(existsSync(testSpecPath)).to.equal(true);
      })
      .then(() => readFile(appModulePath, 'utf-8'))
      .then(content => {
        expect(content).to.matches(/import.*\MyGuardGuard\b.*from '.\/my-guard.guard';/);
        expect(content).to.matches(/providers:\s*\[MyGuardGuard\]/m);
      });
  });

  it('sr generate guard test' + path.sep + 'my-guard', function () {
    fs.mkdirsSync(path.join(root, 'tmp', 'foo', 'src', 'app', 'test'));
    return sr(['generate', 'guard', 'test' + path.sep + 'my-guard']).then(() => {
      var testPath = path.join(root, 'tmp', 'foo', 'src', 'app', 'test', 'my-guard.guard.ts');
      expect(existsSync(testPath)).to.equal(true);
    });
  });

  it('sr generate guard test' + path.sep + '..' + path.sep + 'my-guard', function () {
    return sr(['generate', 'guard', 'test' + path.sep + '..' + path.sep + 'my-guard']).then(() => {
      var testPath = path.join(root, 'tmp', 'foo', 'src', 'app', 'my-guard.guard.ts');
      expect(existsSync(testPath)).to.equal(true);
    });
  });

  it('sr generate guard my-guard from a child dir', () => {
    fs.mkdirsSync(path.join(root, 'tmp', 'foo', 'src', 'app', '1'));
    return new Promise(function (resolve) {
      process.chdir('./src');
      resolve();
    })
      .then(() => process.chdir('./app'))
      .then(() => process.chdir('./1'))
      .then(() => {
        process.env.CWD = process.cwd();
        return sr(['generate', 'guard', 'my-guard'])
      })
      .then(() => {
        var testPath = path.join(root, 'tmp', 'foo', 'src', 'app', '1', 'my-guard.guard.ts');
        expect(existsSync(testPath)).to.equal(true);
      });
  });

  it('sr generate guard child-dir' + path.sep + 'my-guard from a child dir', () => {
    fs.mkdirsSync(path.join(root, 'tmp', 'foo', 'src', 'app', '1', 'child-dir'));
    return new Promise(function (resolve) {
      process.chdir('./src');
      resolve();
    })
      .then(() => process.chdir('./app'))
      .then(() => process.chdir('./1'))
      .then(() => {
        process.env.CWD = process.cwd();
        return sr(['generate', 'guard', 'child-dir' + path.sep + 'my-guard'])
      })
      .then(() => {
        var testPath = path.join(
          root, 'tmp', 'foo', 'src', 'app', '1', 'child-dir', 'my-guard.guard.ts');
        expect(existsSync(testPath)).to.equal(true);
      });
  });

  it('sr generate guard child-dir' + path.sep + '..' + path.sep + 'my-guard from a child dir',
    () => {
      fs.mkdirsSync(path.join(root, 'tmp', 'foo', 'src', 'app', '1'));
      return new Promise(function (resolve) {
        process.chdir('./src');
        resolve();
      })
        .then(() => process.chdir('./app'))
        .then(() => process.chdir('./1'))
        .then(() => {
          process.env.CWD = process.cwd();
          return sr(
            ['generate', 'guard', 'child-dir' + path.sep + '..' + path.sep + 'my-guard'])
        })
        .then(() => {
          var testPath =
            path.join(root, 'tmp', 'foo', 'src', 'app', '1', 'my-guard.guard.ts');
          expect(existsSync(testPath)).to.equal(true);
        });
    });

  it('sr generate guard ' + path.sep + 'my-guard from a child dir, gens under ' +
    path.join('src', 'app'),
    () => {
      fs.mkdirsSync(path.join(root, 'tmp', 'foo', 'src', 'app', '1'));
      return new Promise(function (resolve) {
        process.chdir('./src');
        resolve();
      })
        .then(() => process.chdir('./app'))
        .then(() => process.chdir('./1'))
        .then(() => {
          process.env.CWD = process.cwd();
          return sr(['generate', 'guard', path.sep + 'my-guard'])
        })
        .then(() => {
          var testPath = path.join(root, 'tmp', 'foo', 'src', 'app', 'my-guard.guard.ts');
          expect(existsSync(testPath)).to.equal(true);
        });
    });

  it('sr generate guard ..' + path.sep + 'my-guard from root dir will fail', () => {
    return sr(['generate', 'guard', '..' + path.sep + 'my-guard']).then(() => {
      throw new SilentError(`sr generate guard ..${path.sep}my-guard from root dir should fail.`);
    }, (err) => {
      expect(err).to.equal(`Invalid path: "..${path.sep}my-guard" cannot be above the "src${path.sep}app" directory`);
    });
  });
});
