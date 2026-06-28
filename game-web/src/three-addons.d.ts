// three's example addons (postprocessing passes) ship without bundled .d.ts under
// the 'three/addons/*' specifier; declare them as untyped so TS compiles.
declare module 'three/addons/*'
