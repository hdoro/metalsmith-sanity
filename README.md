# metalsmith-sanity

📌 Simple plugin to import data from [Sanity](https://sanity.io) and inject it in the `files` array of [Metalsmith](https://metalsmith.io)

```bash
yarn add -D metalsmith-sanity
# or
npm i -D metalsmith-sanity
```

## Usage

Add the plugin to the `metalsmith` instance at the highest position possible:

```js
const Metalsmith = require('metalsmith')
const metalsmithSanity = require('metalsmith-sanity')

const isProduction = process.env.NODE_ENV === 'production'

const metalsmith = Metalsmith(__dirname)
  .source('./source')
  .destination('./public')
  .use(
    metalsmithSanity({
      // Config object for the @sanity/client package
      // See https://www.npmjs.com/package/@sanity/client
      clientConfig: {
        projectId: 'pfntyadl', // required, else will throw
        dataset: 'production', // defaults to 'production'
        // Add a token if you want to import drafts as well.
        // In the example below we're only using the token in the dev environment
        token: isProduction ? undefined : '812387sdafk920831ifdslkj9230dsif',
        useCdn: true // defaults to true
      },

      // Choose which is going to be the data file's key inside of the `files`
      // array
      filesKey: 'data.json', // defaults to sanity.json

      // If you don't want to import the data from Sanity at every rebuild, you can
      // cache it, which is perfect for the dev environment.
      useCache: !isProduction, // defaults to false
      // You can choose where to save the cached data. Will import from Sanity if
      // cached file doesn't exist.
      // defaults to './.cache/sanity-cached.json'
      cacheFilePath: './.cache/cached-data.json'
    })
  )
  .build(err => {
    if (err) {
      console.error(err)
      throw err
    }
  })
```

## Quick tip

I highly encourage you to **use [groq.js](https://github.com/sanity-io/groq-js) as a means for accessing the data** before passing it into templates instead of trying to process it through plain JS methods. It's going to save you tons of time and headaches 😉

**Quick example**:

```js
// Inside of metalsmith.js
metalsmith
  .use(metalsmithSanity({ /* config */ }))
  .use(layoutRenderer)

// layoutRenderer.js
import { parse, evaluate } from 'groq-js'

module.exports = (files, metalsmith, done) => {
  // You can set the data file key in the metalsmith-sanity plugin options
  const sanityData = files['sanity.json']

  // Example GROQ query that expands the post.category reference
  const postsQuery = `*[_type == 'post']{
    category->{name},
    ...
  }`

  // Get all the posts through groq's methods
  const postsTree = parse(postsQuery)
  const allPosts = await evaluate(postsTree, { documents: sanityData }).get()

  // And finally add an html file for each post
  for (const post of allPosts) {
    files[`${post.slug.current}/index.html`] = {
      // The content comes from a postTemplate function, which could be a
      // nunjucks template, React / Vue / Svelte component, or much more!
      contents: Buffer.from(postTemplate(post))
    }
  }
}
```

If we were to go through the `sanityData` array above and manually expand each `post.category` reference, we'd have something like:

```js
const allPosts = sanityData.map(doc => {
  if (doc._type !== 'post') {
    return doc
  }
  return {
    ...doc,
    category: sanityData.find(
      possibleCategory => possibleCategory._id === doc.category._ref
    )
  }
})
```

Not too hard, right? Now imagine doing this sort of manual operations to data with 10+ types of documents and thousands of entries? Believe me, it's _not_ fun! **GROQ solves all this and more**, and it's easier to learn and even more powerful than GraphQL for this sorts of operations! If in doubt, feel free to [reach me on Twitter](https://twitter.com/hcavaliericodes).
