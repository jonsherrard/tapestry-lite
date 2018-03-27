import React from 'react'
import PropTypes from 'prop-types'

// Add a stringify template helper for outputting JSON with forward
// slashes escaped to prevent '</script>' tag output in JSON within
// script tags. See http://stackoverflow.com/questions/66837/when-is-a-cdata-section-necessary-within-a-script-tag/1450633#1450633
const escapeScriptTags = data => {
  return (
    JSON.stringify(data)
      .replace(/\//g, '\\/')
      // Escape u2028 and u2029
      // http://timelessrepo.com/json-isnt-a-javascript-subset
      // https://github.com/mapbox/tilestream-pro/issues/1638
      .replace(/\u2028/g, '\\u2028')
      .replace(/\u2029/g, '\\u2029')
  )
}

const DefaultDocument = ({ html, css, head, bootstrapData }) => {
  const attr = head.htmlAttributes.toComponent()
  return (
    <html lang="en" {...attr}>
      <head>
        {head.title.toComponent()}
        {head.base.toComponent()}
        {head.meta.toComponent()}
        {head.link.toComponent()}
        {head.script.toComponent()}
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <link rel="shortcut icon" href="/public/favicon.ico" />
      </head>
      <body>
        <div id="root" dangerouslySetInnerHTML={{ __html: html }} />
        {bootstrapData && (
          <script
            type="text/javascript"
            dangerouslySetInnerHTML={{
              __html: `window.__BOOTSTRAP_DATA__ = ${escapeScriptTags(bootstrapData)}`
            }}
          />
        )}
      </body>
      <script defer src="http://localhost:4001/static/js/bundle.js"></script>
    </html>
  )
}

DefaultDocument.propTypes = {
  html: PropTypes.string.isRequired,
  ids: PropTypes.array.isRequired,
  css: PropTypes.string.isRequired,
  head: PropTypes.object.isRequired
}

export default DefaultDocument
