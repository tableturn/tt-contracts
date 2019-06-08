#!/usr/bin/env node

const fs = require('fs');

const INPUT_DIR = './build/contracts';
const OUTPUT_DIR = './build/abi';

const readData = name => JSON.parse(fs.readFileSync(`${INPUT_DIR}/${name}`, { encoding: 'utf8' }));

const write = (name, ext, data) => {
  const filename = `${OUTPUT_DIR}/${name.replace('.json', `.${ext}`)}`;
  const encoding = 'utf8';
  fs.writeFileSync(filename, data, { encoding });
};

try {
  fs.mkdirSync(OUTPUT_DIR);
} catch {}

console.log('Extracting contracts ABIs and bytecode to a separate folder...');
for (let name of fs.readdirSync(INPUT_DIR)) {
  console.log(`  Processing ${name}.`);
  const data = readData(name);
  write(name, 'abi', JSON.stringify(data.abi));
  write(name, 'bin', data.bytecode.substring(2));
}
