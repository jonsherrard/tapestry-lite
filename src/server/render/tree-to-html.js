import React from 'react'
import { renderToString, renderToStaticMarkup } from 'react-dom/server'
import { getLoadableState } from 'loadable-components/server'
import Helmet from 'react-helmet'

export default async ({
  Component,
  routeOptions = {},
  match,
  componentData,
  queryParams
}) => {
  const _tapestryData = {
    requestData: {
      ...match,
      queryParams
    }
  }
  // create html string from target component
  const app = <Component {...componentData} _tapestry={_tapestryData} />
  // getLoadableState must be called before renderToString to preload all import() components
  const loadableState = await getLoadableState(app)
  const htmlString = renderToString(app)
  // { html, css, ids }
  let styleData = {}
  // extract html, css and ids from either Glamor or Emotion
  styleData = require('emotion-server').extractCritical(htmlString)
  const helmet = Helmet.renderStatic()
  // Assets to come, everything else works
  const renderData = {
    ...styleData,
    head: helmet,
    bootstrapData: componentData,
    _tapestryData,
    loadableState
  }
  let Document =
    routeOptions.customDocument || require('../render/default-document').default
  return `${
    routeOptions.disableDoctype ? '' : '<!doctype html>'
  }${renderToStaticMarkup(<Document {...renderData} />)}`
}
