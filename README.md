PS C:\Users\Mayank.Sharma9\Desktop\LTCS\git-repo\content-workflow-project> npm audit fix

up to date, audited 622 packages in 6s

248 packages are looking for funding
  run `npm fund` for details

# npm audit report

ajv  <8.18.0
Severity: moderate
ajv has ReDoS when using `$data` option - https://github.com/advisories/GHSA-2g4f-4pwh-qvx6
fix available via `npm audit fix --force`
Will install eslint@10.0.0, which is a breaking change
node_modules/ajv
  @eslint/eslintrc  *
  Depends on vulnerable versions of ajv
  Depends on vulnerable versions of minimatch
  node_modules/@eslint/eslintrc
    eslint  0.7.1 - 2.0.0-rc.1 || >=4.1.0
    Depends on vulnerable versions of @eslint/config-array
    Depends on vulnerable versions of @eslint/eslintrc
    Depends on vulnerable versions of ajv
    Depends on vulnerable versions of minimatch
    node_modules/eslint

minimatch  <10.2.1
Severity: high
minimatch has a ReDoS via repeated wildcards with non-matching literal in pattern - https://github.com/advisories/GHSA-3ppc-4f35-3m26
fix available via `npm audit fix --force`
Will install eslint@10.0.0, which is a breaking change
node_modules/@typescript-eslint/typescript-estree/node_modules/minimatch
node_modules/minimatch
  @eslint/config-array  <=0.22.0
  Depends on vulnerable versions of minimatch
  node_modules/@eslint/config-array
  @typescript-eslint/typescript-estree  >=6.16.0
  Depends on vulnerable versions of minimatch
  node_modules/@typescript-eslint/typescript-estree
    @typescript-eslint/parser  >=6.16.0
    Depends on vulnerable versions of @typescript-eslint/typescript-estree
    node_modules/@typescript-eslint/parser
      @typescript-eslint/eslint-plugin  >=6.16.0
      Depends on vulnerable versions of @typescript-eslint/parser
      Depends on vulnerable versions of @typescript-eslint/type-utils
      Depends on vulnerable versions of @typescript-eslint/utils
      node_modules/@typescript-eslint/eslint-plugin
        typescript-eslint  *
        Depends on vulnerable versions of @typescript-eslint/eslint-plugin
        Depends on vulnerable versions of @typescript-eslint/parser
        Depends on vulnerable versions of @typescript-eslint/typescript-estree
        Depends on vulnerable versions of @typescript-eslint/utils
        node_modules/typescript-eslint
          eslint-config-next  >=10.2.1-canary.2
          Depends on vulnerable versions of eslint-plugin-import
          Depends on vulnerable versions of eslint-plugin-jsx-a11y
          Depends on vulnerable versions of eslint-plugin-react
          Depends on vulnerable versions of typescript-eslint
          node_modules/eslint-config-next
    @typescript-eslint/type-utils  >=6.16.0
    Depends on vulnerable versions of @typescript-eslint/typescript-estree
    Depends on vulnerable versions of @typescript-eslint/utils
    node_modules/@typescript-eslint/type-utils
    @typescript-eslint/utils  >=6.16.0
    Depends on vulnerable versions of @typescript-eslint/typescript-estree
    node_modules/@typescript-eslint/utils
  eslint-plugin-import  >=1.15.0
  Depends on vulnerable versions of minimatch
  node_modules/eslint-plugin-import
  eslint-plugin-jsx-a11y  >=6.5.0
  Depends on vulnerable versions of minimatch
  node_modules/eslint-plugin-jsx-a11y
  eslint-plugin-react  >=7.23.0
  Depends on vulnerable versions of minimatch
  node_modules/eslint-plugin-react

15 vulnerabilities (1 moderate, 14 high)

To address issues that do not require attention, run:
  npm audit fix

To address all issues (including breaking changes), run:
  npm audit fix --force
