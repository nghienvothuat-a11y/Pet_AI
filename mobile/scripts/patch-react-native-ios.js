const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function replaceInFile(relativePath, replacements) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) {
    return;
  }

  let source = fs.readFileSync(filePath, "utf8");
  let next = source;

  for (const [from, to] of replacements) {
    next = next.replace(from, to);
  }

  if (next !== source) {
    fs.writeFileSync(filePath, next);
  }
}

replaceInFile("node_modules/react-native/third-party-podspecs/boost.podspec", [
  [
    "https://boostorg.jfrog.io/artifactory/main/release/1.76.0/source/boost_1_76_0.tar.bz2",
    "https://archives.boost.io/release/1.76.0/source/boost_1_76_0.tar.bz2"
  ]
]);

replaceInFile("node_modules/react-native/ReactCommon/yoga/yoga/YGValue.h", [
  ["operator\"\" _pt", "operator\"\"_pt"],
  ["operator\"\" _percent", "operator\"\"_percent"]
]);
