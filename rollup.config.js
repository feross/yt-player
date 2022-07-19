import { terser } from "rollup-plugin-terser"

export default {
  input: "src/index.js",
  treeShake: "smallest",
  output: [
    {
      file: "dist/y2be-player.js",
      format: "es",
    },
    {
      file: "dist/y2be-player.min.js",
      format: "es",
      compact: true,
      plugins: [terser()],
    }
  ],
};
