const importFromSanity = require('./importFromSanity')

const debug = require('debug')('metalsmith-sanity')

/*
  Options:
  - clientConfig:
    * dataset = 'production'
    * projectId
    * useCdn = true
    * token
  - useCache = false
  - cacheFilePath = ".cache/sanity-cached.json"
  - filesKey = "sanity.json"
*/
module.exports = options => {
  if (
    !options ||
    typeof options !== 'object' ||
    (!options.clientConfig || !options.clientConfig.projectId)
  ) {
    throw debug(
      'Please provide a valid clientConfig.projectId string for the Sanity project'
    )
  }

  // getting the default options
  const {
    useCache = false,
    cacheFilePath = './.cache/sanity-cached.json',
    filesKey = 'sanity.json',
    clientConfig
  } = options

  return function(files, _metalsmith, done) {
    importFromSanity({
      useCache,
      cacheFilePath,
      clientConfig,
      debug
    }).then(sanityData => (files[filesKey] = sanityData))

    setImmediate(done)
  }
}
