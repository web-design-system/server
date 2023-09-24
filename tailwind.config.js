module.exports = {
  purge: [],
  presets: [require('./presets/' + process.env.PRESET + '.cjs')],
};
