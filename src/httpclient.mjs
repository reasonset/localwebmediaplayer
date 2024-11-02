class HTTPStatusError extends Error {
  constructor(response, ...arg) {
    super(...arg)
    this.status = response.status
    this.headers = response.headers
  }
}

class HTTPRedirectError extends HTTPStatusError {
  constructor(response, ...arg) {
    super(response, ...arg)
  }
}

class HTTPClient {
  constructor(url, body, options) {
    this.url = this.create_request_url(url, options.query)
    this.body = this.create_request_body(body, options)
    this.options = options
    this.params = this.create_http_params(body, options)
  }

  create_request_url(url, query) {
    const qparam = (typeof query === "string") ? query : new URLSearchParams(query)
    return `${url}?${qparam}`
  }

  create_request_body(body, options) {
    if (!body || options.method === "GET" || options.method === "DELETE") { return }
    if (typeof body === 'string' || options.style === "blob") { return body }

    if (options.style === "form") {
      options.headers["Content-Type"] = "application/x-www-form-urlencoded"
      return new URLSearchParams(body)
    }

    // JSON
    options.headers["Content-Type"] = "application/json"
    return JSON.stringify(body)
  }

  create_http_params(body, options) {
    return {
      method: options.method,
      body,
      headers: options.headers
    }
  }

  /**
   * Do HTTP request.
   * @returns {Promise<string>} response body.
   */
  async request() {
    const result = await fetch(this.url, this.params)
    if (result.status >= 300 && result.status < 400) {
      throw new HTTPRedirectError(result, "HTTP returns redirect.")
    } else if (result.status >= 400) {
      throw new HTTPStatusError(result, "HTTP returns error status.")
    }
    if (this.options.blob) {
      const blob = await result.blob()
      return blob
    } else {
      const text = await result.text()
      if (result.status === 204 || !text) {
        // No content
        return null
      } else {
        try {
          return JSON.parse(text)
        } catch(e) {
          return text
        }
      }
    }
  }
}

/**
 * @typedef {Object} requestOptions
 * @property {string|object} [query] Query object
 * @property {object} [headers] HTTP request headers
 * @property {string} [style] Request body translation style
 * @property {boolean} [blob] Is response body a blob?
 */

const http = {
  /**
   * GET Method request
   * @param {string} url Request resource URL
   * @param {requestOptions} options 
   * @returns {Promise<string>} Response data
   */
  get: (url, options={}) => {
    options.method = "GET"
    const client = new HTTPClient(url, null, options)
    return client.request()
  },

  /**
   * POST method request
   * @param {string} url Request resource URL
   * @param {*} body Request body
   * @param {requestOptions} options 
   * @returns {Promise<string>} Response data
   */
  post: (url, body, options={}) => {
    options.method = "POST"
    const client = new HTTPClient(url, body, options)
    return client.request()
  },

  /**
   * PUT Method request
   * @param {string} url Request resource URL
   * @param {*} body Request body
   * @param {requestOptions} options 
   * @returns {Promise<string>} Response data
   */
  put: (url, body, options={}) => {
    options.method = "PUT"
    const client = new HTTPClient(url, body, options)
    return client.request()
  },

  /**
   * DELETE method request
   * @param {string} url Request resource URL
   * @param {requestOptions} options 
   * @returns {Promise<string>} Response data
   */
  delete: (url, options={}) => {
    options.method = "DELETE"
    const client = new HTTPClient(url, null, options)
    return client.request()
  }
}

export {http, HTTPClient}