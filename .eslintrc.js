module.exports = {
  "root": true,
  "env": {
    "es6": true,
    "node": true
  },
  "parserOptions": {
    "ecmaVersion": 2017,
    "sourceType": "module"
  },
  "extends": "eslint:recommended",
  "rules": {
    "indent": ["error", 2, { "SwitchCase": 1 }],
    "quotes": ["error", "single", { "avoidEscape": true, "allowTemplateLiterals": true }],
    "semi": ["error", "never"],
    "no-unused-vars": ["error", { "vars": "all", "args": "none" }],
    "no-console": 0
  }
}
