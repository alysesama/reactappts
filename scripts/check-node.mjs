const [major] = process.versions.node.split('.').map(Number);

if (major !== 18) {
  console.error(`Expected Node 18, got ${process.versions.node}`);
  process.exit(1);
}

console.log(`Node version OK: ${process.versions.node}`);
