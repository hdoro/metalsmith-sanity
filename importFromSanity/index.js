const sanityClient = require('@sanity/client')
const split = require('split2')
const through = require('through2')
const jsonfile = require('jsonfile')

const getDocumentStream = require('./getDocumentStream')
const pump = require('./pump')

module.exports = async ({
  useCache,
  cacheFilePath,
  clientConfig: { dataset = 'production', useCdn = true, ...config },
  debug
}) => {
  // To save some requests to the Sanity API and make the workflow faster, we
  // can cache the data and retrieve it when useCache is set to `true`
  if (useCache) {
    debug('Fetching data from cache')
    try {
      const cachedDocs = await jsonfile.readFileSync(cacheFilePath, err => {
        if (err) {
          debug("Could't retrieve data from cache", err)
        } else {
          debug(`Sanity data retrieved from the cached file ${cacheFilePath}`)
        }
      })
      return cachedDocs
    } catch (error) {
      debug(
        `Could't retrieve data from cache (${cacheFilePath}), proceeding to generating the data`
      )
    }
  }

  // Setting up our client with defaults for the dataset and useCdn
  const client = sanityClient({ ...config, dataset, useCdn })
  const exportUrl = client.getUrl(`/data/export/production`)

  // And finally starting to populate the allDocs array with the pumped data
  let allDocs = []
  // console.time('[metalsmith-sanity] exporting data: ')
  try {
    const inputStream = await getDocumentStream(exportUrl)
    await pump([
      inputStream,
      split(JSON.parse),
      through.obj((doc, _enc, cb) => {
        allDocs = [...allDocs, doc]
        cb()
      })
    ])
  } catch (error) {
    console.error(error)
  }
  // console.timeEnd('[metalsmith-sanity] exporting data: ')

  if (useCache) {
    jsonfile.writeFile(cacheFilePath, allDocs, { spaces: 2 }, err => {
      if (err) {
        debug(`Could't cache data to ${cacheFilePath}`, err)
      } else {
        debug(`Sanity data cached in file ${cacheFilePath}`)
      }
    })
  }
  return allDocs
}
