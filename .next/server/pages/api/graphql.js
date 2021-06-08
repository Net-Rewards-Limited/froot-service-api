(function() {
var exports = {};
exports.id = "pages/api/graphql";
exports.ids = ["pages/api/graphql"];
exports.modules = {

/***/ "./lib/cors.js":
/*!*********************!*\
  !*** ./lib/cors.js ***!
  \*********************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
const allowCors = fn => async (req, res) => {
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || '*');
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  return await fn(req, res);
};

/* harmony default export */ __webpack_exports__["default"] = (allowCors);

/***/ }),

/***/ "./pages/api/graphql.js":
/*!******************************!*\
  !*** ./pages/api/graphql.js ***!
  \******************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "config": function() { return /* binding */ config; }
/* harmony export */ });
/* harmony import */ var apollo_server_micro__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! apollo-server-micro */ "apollo-server-micro");
/* harmony import */ var apollo_server_micro__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(apollo_server_micro__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _lib_cors__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../lib/cors */ "./lib/cors.js");
/* harmony import */ var _src_graphql_server__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../src/graphql-server */ "./src/graphql-server/index.js");
/* harmony import */ var _src_graphql_server__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_src_graphql_server__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _src_services_user_service__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../src/services/user-service */ "./src/services/user-service/index.js");
/* harmony import */ var _src_services_user_service__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_src_services_user_service__WEBPACK_IMPORTED_MODULE_3__);




const apolloServer = new apollo_server_micro__WEBPACK_IMPORTED_MODULE_0__.ApolloServer(_src_graphql_server__WEBPACK_IMPORTED_MODULE_2___default()({
  apiPathPrefix: "/api",

  normaliseRequest({
    req
  }) {
    return req;
  },

  refreshUserToken({
    res
  }, newUserToken) {
    res.setHeader("Set-Cookie", `${(_src_services_user_service__WEBPACK_IMPORTED_MODULE_3___default().COOKIE_USER_TOKEN_NAME)}=${newUserToken}; HttpOnly; Max-Age=${(_src_services_user_service__WEBPACK_IMPORTED_MODULE_3___default().COOKIE_USER_TOKEN_MAX_AGE)}; Path=/`);
  }

}));
const config = {
  api: {
    bodyParser: false
  }
};
/* harmony default export */ __webpack_exports__["default"] = ((0,_lib_cors__WEBPACK_IMPORTED_MODULE_1__.default)(apolloServer.createHandler({
  path: "/api/graphql"
})));

/***/ }),

/***/ "./src/graphql-server/create-context.js":
/*!**********************************************!*\
  !*** ./src/graphql-server/create-context.js ***!
  \**********************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

const userService = __webpack_require__(/*! ../services/user-service */ "./src/services/user-service/index.js");

const getHost = __webpack_require__(/*! ../lib/get-host */ "./src/lib/get-host.js");

module.exports = function createContext({
  apiPathPrefix,
  normaliseRequest,
  refreshUserToken
}) {
  return function context(args) {
    const {
      cookies,
      headers
    } = normaliseRequest(args);
    const user = userService.authenticate(cookies[userService.COOKIE_USER_TOKEN_NAME]); // Refresh the user token (if available)

    if (user && refreshUserToken) {
      const newUserToken = userService.validateRefreshToken({
        refreshToken: cookies[userService.COOKIE_REFRESH_TOKEN_NAME],
        email: user.email
      });

      if (newUserToken) {
        refreshUserToken(args, newUserToken);
      }
    } // Determine the URL for webhook callbacks (ex: https://service-api.example.com/api)


    const publicHost = getHost({
      headers
    }) + apiPathPrefix;
    /**
     * serviceCallbackHost is used for third party services callbacks
     * It will be used in e.g. payment provider services callbacks
     * when async operations are finished
     *
     * Example for local development:
     *  - publicHost: http://localhost:3001/api
     *  - serviceCallbackHost: https://abcdefgh12345.ngrok.io/api
     *
     * Example for prod development:
     *  - publicHost: https://my-service-api.shop.com/api
     *  - serviceCallbackHost: https://my-service-api.shop.com/api
     */

    let serviceCallbackHost = process.env.SERVICE_CALLBACK_HOST;

    if (serviceCallbackHost) {
      if (!serviceCallbackHost.endsWith(apiPathPrefix)) {
        serviceCallbackHost += apiPathPrefix;
      }
    } else {
      serviceCallbackHost = publicHost;
    }

    return {
      user,
      publicHost,
      serviceCallbackHost
    };
  };
};

/***/ }),

/***/ "./src/graphql-server/index.js":
/*!*************************************!*\
  !*** ./src/graphql-server/index.js ***!
  \*************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

const createContext = __webpack_require__(/*! ./create-context */ "./src/graphql-server/create-context.js");

const resolvers = __webpack_require__(/*! ./resolvers */ "./src/graphql-server/resolvers.js");

const typeDefs = __webpack_require__(/*! ./type-defs */ "./src/graphql-server/type-defs.js");

module.exports = function createGraphqlServerConfig({
  apiPathPrefix = "",
  refreshUserToken,
  normaliseRequest
}) {
  const context = createContext({
    apiPathPrefix,
    refreshUserToken,
    normaliseRequest
  });
  return {
    context,
    resolvers,
    typeDefs,
    introspection: true,
    playground: {
      endpoint: context.publicHost,
      settings: {
        "request.credentials": "include"
      }
    },
    // Disable subscriptions (not currently supported with ApolloGateway)
    subscriptions: false
  };
};

/***/ }),

/***/ "./src/graphql-server/resolvers.js":
/*!*****************************************!*\
  !*** ./src/graphql-server/resolvers.js ***!
  \*****************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const crystallize = __webpack_require__(/*! ../services/crystallize */ "./src/services/crystallize/index.js");

const basketService = __webpack_require__(/*! ../services/basket-service */ "./src/services/basket-service/index.js");

const userService = __webpack_require__(/*! ../services/user-service */ "./src/services/user-service/index.js");

const voucherService = __webpack_require__(/*! ../services/voucher-service */ "./src/services/voucher-service/index.js");

const stripeService = __webpack_require__(/*! ../services/payment-providers/stripe */ "./src/services/payment-providers/stripe/index.js");

const mollieService = __webpack_require__(/*! ../services/payment-providers/mollie */ "./src/services/payment-providers/mollie/index.js");

const vippsService = __webpack_require__(/*! ../services/payment-providers/vipps */ "./src/services/payment-providers/vipps/index.js");

const klarnaService = __webpack_require__(/*! ../services/payment-providers/klarna */ "./src/services/payment-providers/klarna/index.js");

function paymentProviderResolver(service) {
  return () => {
    return {
      enabled: service.enabled,
      config: service.frontendConfig
    };
  };
}

module.exports = {
  Query: {
    myCustomBusinessThing: () => ({
      whatIsThis: "This is an example of a custom query for GraphQL demonstration purpuses. Check out the MyCustomBusinnessQueries resolvers for how to resolve additional fields apart from the 'whatIsThis' field"
    }),
    basket: (parent, args, context) => basketService.get(_objectSpread(_objectSpread({}, args), {}, {
      context
    })),
    user: (parent, args, context) => userService.getUser({
      context
    }),
    orders: () => ({}),
    paymentProviders: () => ({}),
    voucher: (parent, args, context) => voucherService.get(_objectSpread(_objectSpread({}, args), {}, {
      context
    }))
  },
  MyCustomBusinnessQueries: {
    dynamicRandomInt() {
      console.log("dynamicRandomInt called");
      return parseInt(Math.random() * 100);
    }

  },
  PaymentProvidersQueries: {
    stripe: paymentProviderResolver(stripeService),
    klarna: paymentProviderResolver(klarnaService),
    vipps: paymentProviderResolver(vippsService),
    mollie: paymentProviderResolver(mollieService)
  },
  OrderQueries: {
    get: (parent, args) => crystallize.orders.get(args.id)
  },
  Mutation: {
    user: () => ({}),
    paymentProviders: () => ({})
  },
  UserMutations: {
    sendMagicLink: (parent, args, context) => userService.sendMagicLink(_objectSpread(_objectSpread({}, args), {}, {
      context
    })),
    update: (parent, args, context) => userService.update(_objectSpread(_objectSpread({}, args), {}, {
      context
    }))
  },
  PaymentProvidersMutations: {
    stripe: () => ({}),
    klarna: () => ({}),
    mollie: () => ({}),
    vipps: () => ({})
  },
  StripeMutations: {
    createPaymentIntent: (parent, args, context) => stripeService.createPaymentIntent(_objectSpread(_objectSpread({}, args), {}, {
      context
    })),
    confirmOrder: (parent, args, context) => stripeService.confirmOrder(_objectSpread(_objectSpread({}, args), {}, {
      context
    }))
  },
  KlarnaMutations: {
    renderCheckout: (parent, args, context) => klarnaService.renderCheckout(_objectSpread(_objectSpread({}, args), {}, {
      context
    }))
  },
  MollieMutations: {
    createPayment: (parent, args, context) => mollieService.createPayment(_objectSpread(_objectSpread({}, args), {}, {
      context
    }))
  },
  VippsMutations: {
    initiatePayment: (parent, args, context) => vippsService.initiatePayment(_objectSpread(_objectSpread({}, args), {}, {
      context
    }))
  }
};

/***/ }),

/***/ "./src/graphql-server/type-defs.js":
/*!*****************************************!*\
  !*** ./src/graphql-server/type-defs.js ***!
  \*****************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

const gql = __webpack_require__(/*! graphql-tag */ "graphql-tag");

module.exports = gql`
  scalar JSON

  type Query {
    myCustomBusinessThing: MyCustomBusinnessQueries!
    basket(basketModel: BasketModelInput!): Basket!
    user: User!
    paymentProviders: PaymentProvidersQueries!
    orders: OrderQueries!
    voucher(code: String!): VoucherResponse!
  }

  type VoucherResponse {
    voucher: Voucher
    isValid: Boolean!
  }

  type MyCustomBusinnessQueries {
    whatIsThis: String!
    dynamicRandomInt: Int!
  }

  type Basket {
    cart: [CartItem!]!
    total: Price!
    voucher: Voucher
  }

  type CartItem {
    sku: String!
    name: String
    path: String
    quantity: Int!
    vatType: VatType
    stock: Int
    price: Price
    priceVariants: [PriceVariant!]
    attributes: [Attribute!]
    images: [Image!]
  }

  type PriceVariant {
    price: Float
    identifier: String!
    currency: String!
  }

  type Attribute {
    attribute: String!
    value: String
  }

  type Image {
    url: String!
    variants: [ImageVariant!]
  }

  type ImageVariant {
    url: String!
    width: Int
    height: Int
  }

  type Price {
    gross: Float!
    net: Float!
    currency: String
    tax: Tax
    taxAmount: Float
    discount: Float!
  }

  type Tax {
    name: String
    percent: Float
  }

  type VatType {
    name: String!
    percent: Int!
  }

  type User {
    logoutLink: String!
    isLoggedIn: Boolean!
    email: String
    firstName: String
    middleName: String
    lastName: String
    meta: [KeyValuePair!]
  }

  type PaymentProvidersQueries {
    stripe: PaymentProvider!
    klarna: PaymentProvider!
    vipps: PaymentProvider!
    mollie: PaymentProvider!
  }

  type PaymentProvider {
    enabled: Boolean!
    config: JSON
  }

  type OrderQueries {
    get(id: String!): JSON
  }

  type Voucher {
    code: String!
    discountAmount: Int
    discountPercent: Float
  }

  type Mutation {
    user: UserMutations
    paymentProviders: PaymentProvidersMutations!
  }

  input BasketModelInput {
    locale: LocaleInput!
    cart: [SimpleCartItem!]!
    voucherCode: String
    crystallizeOrderId: String
    klarnaOrderId: String
  }

  input LocaleInput {
    locale: String!
    displayName: String
    appLanguage: String!
    crystallizeCatalogueLanguage: String
    crystallizePriceVariant: String
  }

  input SimpleCartItem {
    sku: String!
    path: String!
    quantity: Int
    priceVariantIdentifier: String!
  }

  type UserMutations {
    sendMagicLink(
      email: String!
      redirectURLAfterLogin: String!
    ): SendMagicLinkResponse!
    update(input: UserUpdateInput!): User!
  }

  input UserUpdateInput {
    firstName: String
    middleName: String
    lastName: String
    meta: [KeyValuePairInput!]
  }

  type SendMagicLinkResponse {
    success: Boolean!
    error: String
  }

  input CheckoutModelInput {
    basketModel: BasketModelInput!
    customer: OrderCustomerInput
    confirmationURL: String!
    checkoutURL: String!
    termsURL: String!
  }

  input OrderCustomerInput {
    firstName: String
    lastName: String
    addresses: [AddressInput!]
  }

  input AddressInput {
    type: String
    email: String
    firstName: String
    middleName: String
    lastName: String
    street: String
    street2: String
    streetNumber: String
    postalCode: String
    city: String
    state: String
    country: String
    phone: String
  }

  type PaymentProvidersMutations {
    stripe: StripeMutations!
    klarna: KlarnaMutations!
    mollie: MollieMutations!
    vipps: VippsMutations!
  }

  type StripeMutations {
    createPaymentIntent(
      checkoutModel: CheckoutModelInput!
      confirm: Boolean
      paymentMethodId: String
    ): JSON
    confirmOrder(
      checkoutModel: CheckoutModelInput!
      paymentIntentId: String!
    ): StripeConfirmOrderResponse!
  }

  type StripeConfirmOrderResponse {
    success: Boolean!
    orderId: String
  }

  type KlarnaMutations {
    renderCheckout(
      checkoutModel: CheckoutModelInput!
    ): KlarnaRenderCheckoutReponse!
  }

  type KlarnaRenderCheckoutReponse {
    html: String!
    klarnaOrderId: String!
    crystallizeOrderId: String!
  }

  type MollieMutations {
    createPayment(
      checkoutModel: CheckoutModelInput!
    ): MollieCreatePaymentResponse!
  }

  type MollieCreatePaymentResponse {
    success: Boolean!
    checkoutLink: String
    crystallizeOrderId: String!
  }

  type VippsMutations {
    initiatePayment(
      checkoutModel: CheckoutModelInput!
    ): VippsInitiatePaymentResponse!
  }

  type VippsInitiatePaymentResponse {
    success: Boolean!
    checkoutLink: String
    crystallizeOrderId: String!
  }

  type KeyValuePair {
    key: String!
    value: String
  }

  input KeyValuePairInput {
    key: String!
    value: String
  }
`;

/***/ }),

/***/ "./src/lib/currency.js":
/*!*****************************!*\
  !*** ./src/lib/currency.js ***!
  \*****************************/
/***/ (function(module) {

function formatCurrency({
  amount,
  currency
}) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(amount);
}

module.exports = {
  formatCurrency
};

/***/ }),

/***/ "./src/lib/get-host.js":
/*!*****************************!*\
  !*** ./src/lib/get-host.js ***!
  \*****************************/
/***/ (function(module) {

module.exports = function getHost({
  headers
}) {
  // If behind a reverse proxy like AWS Elastic Beanstalk for instance
  const {
    "x-forwarded-proto": xprotocol,
    "x-forwarded-host": xhost
  } = headers;

  if (xprotocol && xhost) {
    return `${xprotocol}://${xhost}`;
  }

  if (process.env.HOST_URL) {
    return process.env.HOST_URL;
  }

  const {
    Host,
    host = Host
  } = headers;

  if (host && host.startsWith("localhost")) {
    return `http://${host}`;
  } // If hosted on Vercel


  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  if (!host) {
    throw new Error("Cannot determine host for the current request context");
  }

  return `https://${host}`;
};

/***/ }),

/***/ "./src/services/basket-service/calculate-voucher-discount-amount.js":
/*!**************************************************************************!*\
  !*** ./src/services/basket-service/calculate-voucher-discount-amount.js ***!
  \**************************************************************************/
/***/ (function(module) {

function truncateDecimalsOfNumber(originalNumber, numberOfDecimals = 2) {
  // toFixed() converts a number into a string by truncating it
  // with the number of decimals passed as parameter.
  const amountTruncated = originalNumber.toFixed(numberOfDecimals); // We use parseFloat() to return a transform the string into a number

  return parseFloat(amountTruncated);
}

function calculateVoucherDiscountAmount({
  voucher,
  amount
}) {
  // We assume that the voucher has the right format.
  // It either has `discountPercent` or `discountAmount`
  const isDiscountAmount = Boolean(voucher.discountAmount);

  if (isDiscountAmount) {
    return voucher.discountAmount;
  }

  const amountToDiscount = amount * voucher.discountPercent / 100;
  return truncateDecimalsOfNumber(amountToDiscount);
}

module.exports = {
  calculateVoucherDiscountAmount
};

/***/ }),

/***/ "./src/services/basket-service/get-products-from-crystallize.js":
/*!**********************************************************************!*\
  !*** ./src/services/basket-service/get-products-from-crystallize.js ***!
  \**********************************************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

/**
 * Gets information for products with a given path.
 * Gets all of the products with a single request
 * by composing the query dynamically
 */
async function getProductsFromCrystallize({
  paths,
  language
}) {
  if (paths.length === 0) {
    return [];
  }

  const {
    callCatalogueApi
  } = __webpack_require__(/*! ../crystallize/utils */ "./src/services/crystallize/utils.js");

  const response = await callCatalogueApi({
    query: `{
      ${paths.map((path, index) => `
        product${index}: catalogue(path: "${path}", language: "${language}") {
          path
          ... on Product {
            id
            vatType {
              name
              percent
            }
            variants {
              id
              sku
              name
              stock
              priceVariants {
                price
                identifier
                currency
              }
              attributes {
                attribute
                value
              }
              images {
                url
                variants {
                  url
                  width
                  height
                }
              }
            }
          }
        }
      `)}
    }`
  });
  return paths.map((_, i) => response.data[`product${i}`]).filter(p => !!p);
}

module.exports = {
  getProductsFromCrystallize
};

/***/ }),

/***/ "./src/services/basket-service/index.js":
/*!**********************************************!*\
  !*** ./src/services/basket-service/index.js ***!
  \**********************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

// Calculate the totals
function getTotals({
  cart,
  vatType
}) {
  return cart.reduce((acc, curr) => {
    const {
      quantity,
      price
    } = curr;

    if (price) {
      const priceToUse = price.discounted || price;
      acc.gross += priceToUse.gross * quantity;
      acc.net += priceToUse.net * quantity;
      acc.currency = price.currency;
    }

    return acc;
  }, {
    gross: 0,
    net: 0,
    tax: vatType,
    discount: 0,
    currency: "N/A"
  });
}

module.exports = {
  async get({
    basketModel,
    context
  }) {
    const {
      locale,
      voucherCode
    } = basketModel,
          basketFromClient = _objectWithoutProperties(basketModel, ["locale", "voucherCode"]);
    /**
     * Resolve all the voucher codes to valid vouchers for the user
     */


    let voucher;

    if (voucherCode) {
      const voucherService = __webpack_require__(/*! ../voucher-service */ "./src/services/voucher-service/index.js");

      const response = await voucherService.get({
        code: voucherCode,
        context
      });

      if (response.isValid) {
        voucher = response.voucher;
      }
    }
    /**
     * Get all products from Crystallize from their paths
     */


    const {
      getProductsFromCrystallize
    } = __webpack_require__(/*! ./get-products-from-crystallize */ "./src/services/basket-service/get-products-from-crystallize.js");

    const productDataFromCrystallize = await getProductsFromCrystallize({
      paths: basketFromClient.cart.map(p => p.path),
      language: locale.crystallizeCatalogueLanguage
    });
    let vatType;
    /**
     * Compose the complete cart items enriched with
     * data from Crystallize
     */

    const cart = basketFromClient.cart.map(itemFromClient => {
      const product = productDataFromCrystallize.find(p => p.variants.some(v => v.sku === itemFromClient.sku));

      if (!product) {
        return null;
      }

      vatType = product.vatType;
      const variant = product.variants.find(v => v.sku === itemFromClient.sku);
      const {
        price,
        currency
      } = variant.priceVariants.find(pv => pv.identifier === itemFromClient.priceVariantIdentifier) || variant.priceVariants.find(p => p.identifier === "default");
      const gross = price;
      const net = price * 100 / (100 + vatType.percent);
      return _objectSpread({
        productId: product.id,
        productVariantId: variant.id,
        path: product.path,
        quantity: itemFromClient.quantity || 1,
        vatType,
        price: {
          gross,
          net,
          tax: vatType,
          currency
        }
      }, variant);
    }).filter(p => !!p); // Calculate the totals

    let total = getTotals({
      cart,
      vatType
    }); // Add a voucher

    let cartWithVoucher = cart;

    if (cart.length > 0 && voucher) {
      const {
        calculateVoucherDiscountAmount
      } = __webpack_require__(/*! ./calculate-voucher-discount-amount */ "./src/services/basket-service/calculate-voucher-discount-amount.js");

      const discountAmount = calculateVoucherDiscountAmount({
        voucher,
        amount: total.gross
      }); // Reduce the price for each item

      cartWithVoucher = cart.map(cartItem => {
        const portionOfTotal = cartItem.price.gross * cartItem.quantity / total.gross;
        /**
         * Each cart item gets a portion of the voucher that
         * is relative to their own portion of the total discount
         */

        const portionOfDiscount = discountAmount * portionOfTotal;
        const gross = cartItem.price.gross - portionOfDiscount / cartItem.quantity;
        const net = gross * 100 / (100 + cartItem.vatType.percent);
        return _objectSpread(_objectSpread({}, cartItem), {}, {
          price: _objectSpread(_objectSpread({}, cartItem.price), {}, {
            gross,
            net
          })
        });
      }); // Adjust totals

      total = getTotals({
        cart: cartWithVoucher,
        vatType
      });
      total.discount = discountAmount;
    }

    return {
      voucher,
      cart: cartWithVoucher,
      total
    };
  }

};

/***/ }),

/***/ "./src/services/crystallize/customers/create-customer.js":
/*!***************************************************************!*\
  !*** ./src/services/crystallize/customers/create-customer.js ***!
  \***************************************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const {
  callPimApi,
  getTenantId
} = __webpack_require__(/*! ../utils */ "./src/services/crystallize/utils.js");

module.exports = async function createCustomer(customer) {
  const tenantId = await getTenantId();
  const response = await callPimApi({
    variables: {
      input: _objectSpread({
        tenantId
      }, customer)
    },
    query: `
      mutation createCustomer(
        $input: CreateCustomerInput!
      ) {
        customer {
          create(
            input: $input
          ) {
            identifier
          }
        }
      }
    `
  });
  return response.data.customer.create;
};

/***/ }),

/***/ "./src/services/crystallize/customers/get-customer.js":
/*!************************************************************!*\
  !*** ./src/services/crystallize/customers/get-customer.js ***!
  \************************************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

const {
  callPimApi,
  getTenantId
} = __webpack_require__(/*! ../utils */ "./src/services/crystallize/utils.js");

module.exports = async function getCustomer({
  identifier,
  externalReference
}) {
  const tenantId = await getTenantId();
  const response = await callPimApi({
    variables: {
      tenantId,
      identifier,
      externalReference
    },
    query: `
      query getCustomer(
        $tenantId: ID!
        $identifier: String
        $externalReference: CustomerExternalReferenceInput
      ){
        customer {
          get(
            tenantId: $tenantId
            identifier: $identifier
            externalReference: $externalReference
          ) {
            identifier
            firstName
            middleName
            lastName
            meta {
              key
              value
            }
          }
        }
      }
    `
  });
  return response.data.customer.get;
};

/***/ }),

/***/ "./src/services/crystallize/customers/index.js":
/*!*****************************************************!*\
  !*** ./src/services/crystallize/customers/index.js ***!
  \*****************************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

const create = __webpack_require__(/*! ./create-customer */ "./src/services/crystallize/customers/create-customer.js");

const update = __webpack_require__(/*! ./update-customer */ "./src/services/crystallize/customers/update-customer.js");

const get = __webpack_require__(/*! ./get-customer */ "./src/services/crystallize/customers/get-customer.js");

module.exports = {
  create,
  update,
  get
};

/***/ }),

/***/ "./src/services/crystallize/customers/update-customer.js":
/*!***************************************************************!*\
  !*** ./src/services/crystallize/customers/update-customer.js ***!
  \***************************************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

const {
  callPimApi,
  getTenantId
} = __webpack_require__(/*! ../utils */ "./src/services/crystallize/utils.js");

module.exports = async function updateCustomer(_ref) {
  let {
    identifier
  } = _ref,
      rest = _objectWithoutProperties(_ref, ["identifier"]);

  const tenantId = await getTenantId();
  const response = await callPimApi({
    variables: _objectSpread({
      tenantId,
      identifier
    }, rest),
    query: `
      mutation updateCustomer(
        $tenantId: ID!
        $identifier: String!
        $customer: UpdateCustomerInput!
      ) {
        customer {
          update(
            tenantId: $tenantId
            identifier: $identifier
            input: $customer
          ) {
            identifier
          }
        }
      }
    `
  });
  return response.data.customer.update;
};

/***/ }),

/***/ "./src/services/crystallize/index.js":
/*!*******************************************!*\
  !*** ./src/services/crystallize/index.js ***!
  \*******************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

const orders = __webpack_require__(/*! ./orders */ "./src/services/crystallize/orders/index.js");

const customers = __webpack_require__(/*! ./customers */ "./src/services/crystallize/customers/index.js");

module.exports = {
  orders,
  customers
};

/***/ }),

/***/ "./src/services/crystallize/orders/create-order.js":
/*!*********************************************************!*\
  !*** ./src/services/crystallize/orders/create-order.js ***!
  \*********************************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

const {
  callOrdersApi,
  normaliseOrderModel
} = __webpack_require__(/*! ../utils */ "./src/services/crystallize/utils.js");

module.exports = async function createOrder(variables) {
  const response = await callOrdersApi({
    variables: normaliseOrderModel(variables),
    query: `
      mutation createOrder(
        $customer: CustomerInput!
        $cart: [OrderItemInput!]!
        $total: PriceInput
        $payment: [PaymentInput!]
        $additionalInformation: String
        $meta: [OrderMetadataInput!]
      ) {
        orders {
          create(
            input: {
              customer: $customer
              cart: $cart
              total: $total
              payment: $payment
              additionalInformation: $additionalInformation
              meta: $meta
            }
          ) {
            id
          }
        }
      }
    `
  });
  return response.data.orders.create;
};

/***/ }),

/***/ "./src/services/crystallize/orders/get-order.js":
/*!******************************************************!*\
  !*** ./src/services/crystallize/orders/get-order.js ***!
  \******************************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

const {
  callOrdersApi
} = __webpack_require__(/*! ../utils */ "./src/services/crystallize/utils.js");

module.exports = async function getOrder(id) {
  const response = await callOrdersApi({
    variables: {
      id
    },
    query: `
      query getOrder($id: ID!){
        orders {
          get(id: $id) {
            id
            total {
              net
              gross
              currency
              tax {
                name
                percent
              }
            }
            meta {
              key
              value
            }
            additionalInformation
            payment {
              ... on StripePayment {
                paymentMethod
              }
              ... on CustomPayment {
                provider
                properties {
                  property
                  value
                }
              }
            }
            cart {
              sku
              name
              quantity
              imageUrl
              price {
                net
                gross
                currency
              }
              meta {
                key
                value
              }
            }
            customer {
              firstName
              lastName
              addresses {
                type
                email
              }
            }
          }
        }
      }
    `
  });
  const order = response.data.orders.get;

  if (!order) {
    throw new Error(`Cannot retrieve order "${id}"`);
  }

  return order;
};

/***/ }),

/***/ "./src/services/crystallize/orders/index.js":
/*!**************************************************!*\
  !*** ./src/services/crystallize/orders/index.js ***!
  \**************************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

const create = __webpack_require__(/*! ./create-order */ "./src/services/crystallize/orders/create-order.js");

const update = __webpack_require__(/*! ./update-order */ "./src/services/crystallize/orders/update-order.js");

const get = __webpack_require__(/*! ./get-order */ "./src/services/crystallize/orders/get-order.js");

const waitForOrderToBePersistated = __webpack_require__(/*! ./wait-for-order-to-be-persistated */ "./src/services/crystallize/orders/wait-for-order-to-be-persistated.js");

module.exports = {
  create,
  update,
  get,
  waitForOrderToBePersistated
};

/***/ }),

/***/ "./src/services/crystallize/orders/update-order.js":
/*!*********************************************************!*\
  !*** ./src/services/crystallize/orders/update-order.js ***!
  \*********************************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const {
  callPimApi,
  normaliseOrderModel
} = __webpack_require__(/*! ../utils */ "./src/services/crystallize/utils.js");

module.exports = async function updateOrder(id, variables) {
  const response = await callPimApi({
    variables: _objectSpread({
      id
    }, normaliseOrderModel(variables)),
    query: `
      mutation updateOrder(
        $id: ID!
        $customer: CustomerInput
        $payment: [PaymentInput!]
        $additionalInformation: String
      ) {
        order {
            update(
            id: $id,
            input: {
              customer: $customer
              payment: $payment
              additionalInformation: $additionalInformation
            }
          ) {
            id
          }
        }
      }
  `
  });
  return response.data.order.update;
};

/***/ }),

/***/ "./src/services/crystallize/orders/wait-for-order-to-be-persistated.js":
/*!*****************************************************************************!*\
  !*** ./src/services/crystallize/orders/wait-for-order-to-be-persistated.js ***!
  \*****************************************************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

const {
  callOrdersApi
} = __webpack_require__(/*! ../utils */ "./src/services/crystallize/utils.js");

module.exports = function waitForOrderToBePersistated({
  id
}) {
  let retries = 0;
  const maxRetries = 10;
  return new Promise((resolve, reject) => {
    (async function check() {
      const response = await callOrdersApi({
        query: `
          {
            orders {
              get(id: "${id}") {
                id
                createdAt
              }
            }
          }
        `
      });

      if (response.data && response.data.orders.get) {
        resolve();
      } else {
        retries += 1;

        if (retries > maxRetries) {
          reject(`Timeout out waiting for Crystallize order "${id}" to be persisted`);
        } else {
          setTimeout(check, 1000);
        }
      }
    })();
  });
};

/***/ }),

/***/ "./src/services/crystallize/utils.js":
/*!*******************************************!*\
  !*** ./src/services/crystallize/utils.js ***!
  \*******************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

const invariant = __webpack_require__(/*! invariant */ "invariant");

const fetch = __webpack_require__(/*! node-fetch */ "node-fetch");

const CRYSTALLIZE_TENANT_IDENTIFIER = process.env.CRYSTALLIZE_TENANT_IDENTIFIER;
const CRYSTALLIZE_ACCESS_TOKEN_ID = process.env.CRYSTALLIZE_ACCESS_TOKEN_ID;
const CRYSTALLIZE_ACCESS_TOKEN_SECRET = process.env.CRYSTALLIZE_ACCESS_TOKEN_SECRET;
invariant(CRYSTALLIZE_TENANT_IDENTIFIER, "Missing process.env.CRYSTALLIZE_TENANT_IDENTIFIER");

function createApiCaller(uri) {
  return async function callApi({
    query,
    variables,
    operationName
  }) {
    invariant(CRYSTALLIZE_ACCESS_TOKEN_ID, "Missing process.env.CRYSTALLIZE_ACCESS_TOKEN_ID");
    invariant(CRYSTALLIZE_ACCESS_TOKEN_SECRET, "Missing process.env.CRYSTALLIZE_ACCESS_TOKEN_SECRET");
    const response = await fetch(uri, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-Crystallize-Access-Token-Id": CRYSTALLIZE_ACCESS_TOKEN_ID,
        "X-Crystallize-Access-Token-Secret": CRYSTALLIZE_ACCESS_TOKEN_SECRET
      },
      body: JSON.stringify({
        operationName,
        query,
        variables
      })
    });
    const json = await response.json();

    if (json.errors) {
      console.log(JSON.stringify(json.errors, null, 2));
    }

    return json;
  };
}

function normaliseOrderModel(_ref) {
  let {
    customer,
    cart,
    total
  } = _ref,
      rest = _objectWithoutProperties(_ref, ["customer", "cart", "total"]);

  return _objectSpread(_objectSpread(_objectSpread(_objectSpread({}, rest), total && {
    total: {
      gross: total.gross,
      net: total.net,
      currency: total.currency,
      tax: total.tax
    }
  }), cart && {
    cart: cart.map(function handleOrderCartItem(item) {
      const {
        images = [],
        name,
        sku,
        productId,
        productVariantId,
        quantity,
        price
      } = item;
      return {
        name,
        sku,
        productId,
        productVariantId,
        quantity,
        price,
        imageUrl: images && images[0] && images[0].url
      };
    })
  }), customer && {
    customer: {
      firstName: customer.firstName || null,
      lastName: customer.lastName || null,
      addresses: customer.addresses || [{
        type: "billing",
        email: customer.email || undefined
      }]
    }
  });
}

const getTenantId = function () {
  let tenantId;
  return async () => {
    if (tenantId) {
      return tenantId;
    }

    const tenantIdResponse = await callCatalogueApi({
      query: `
          {
            tenant {
              id
            }
          }
        `
    });
    tenantId = tenantIdResponse.data.tenant.id;
    return tenantId;
  };
}();
/**
 * Catalogue API is the fast read-only API to lookup data
 * for a given item path or anything else in the catalogue
 */


const callCatalogueApi = createApiCaller(`https://api.crystallize.com/${CRYSTALLIZE_TENANT_IDENTIFIER}/catalogue`);
/**
 * Search API is the fast read-only API to search across
 * all items and topics
 */

const callSearchApi = createApiCaller(`https://api.crystallize.com/${CRYSTALLIZE_TENANT_IDENTIFIER}/search`);
/**
 * Orders API is the highly scalable API to send/read massive
 * amounts of orders
 */

const callOrdersApi = createApiCaller(`https://api.crystallize.com/${CRYSTALLIZE_TENANT_IDENTIFIER}/orders`);
/**
 * The PIM API is used for doing the ALL possible actions on
 * a tenant or your user profile
 */

const callPimApi = createApiCaller("https://pim.crystallize.com/graphql");
module.exports = {
  normaliseOrderModel,
  callCatalogueApi,
  callSearchApi,
  callOrdersApi,
  callPimApi,
  getTenantId
};

/***/ }),

/***/ "./src/services/email-service/index.js":
/*!*********************************************!*\
  !*** ./src/services/email-service/index.js ***!
  \*********************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

const {
  sendEmail
} = __webpack_require__(/*! ./utils */ "./src/services/email-service/utils.js");

const sendOrderConfirmation = __webpack_require__(/*! ./order-confirmation */ "./src/services/email-service/order-confirmation.js");

const sendUserMagicLink = __webpack_require__(/*! ./user-magic-link */ "./src/services/email-service/user-magic-link.js");

module.exports = {
  sendEmail,
  sendOrderConfirmation,
  sendUserMagicLink
};

/***/ }),

/***/ "./src/services/email-service/order-confirmation.js":
/*!**********************************************************!*\
  !*** ./src/services/email-service/order-confirmation.js ***!
  \**********************************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

module.exports = async function sendOrderConfirmation(orderId) {
  try {
    const mjml2html = __webpack_require__(/*! mjml */ "mjml");

    const {
      formatCurrency
    } = __webpack_require__(/*! ../../lib/currency */ "./src/lib/currency.js");

    const {
      orders
    } = __webpack_require__(/*! ../crystallize */ "./src/services/crystallize/index.js");

    const {
      sendEmail
    } = __webpack_require__(/*! ./utils */ "./src/services/email-service/utils.js");

    const order = await orders.get(orderId);
    const {
      email
    } = order.customer.addresses[0];

    if (!email) {
      return {
        success: false,
        error: "No email is conntected with the customer object"
      };
    }

    const {
      html
    } = mjml2html(`
      <mjml>
        <mj-body>
        <mj-section>
          <mj-column>
            <mj-text>
              <h1>Order Summary</h1>
              <p>Thanks for your order! This email contains a copy of your order for your reference.</p>
              <p>
                Order Number: <strong>#${order.id}</strong>
              </p>
              <p>
                First name: <strong>${order.customer.firstName}</strong><br />
                Last name: <strong>${order.customer.lastName}</strong><br />
                Email address: <strong>${email}</strong>
              </p>
              <p>
                Total: <strong>${formatCurrency({
      amount: order.total.gross,
      currency: order.total.currency
    })}</strong>
              </p>
            </mj-text>
            <mj-table>
              <tr style="border-bottom: 1px solid #ecedee; text-align: left;">
                <th style="padding: 0 15px 0 0;">Name</th>
                <th style="padding: 0 15px;">Quantity</th>
                <th style="padding: 0 0 0 15px;">Total</th>
              </tr>
              ${order.cart.map(item => `<tr>
                  <td style="padding: 0 15px 0 0;">${item.name} (${item.sku})</td>
                  <td style="padding: 0 15px;">${item.quantity}</td>
                  <td style="padding: 0 0 0 15px;">${formatCurrency({
      amount: item.price.gross * item.quantity,
      currency: item.price.currency
    })}</td>
                </tr>`)}
            </mj-table>
          </mj-column>
        </mj-section>
        </mj-body>
      </mjml>
    `);
    await sendEmail({
      to: email,
      subject: "Order summary",
      html
    });
    return {
      success: true
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      error
    };
  }
};

/***/ }),

/***/ "./src/services/email-service/user-magic-link.js":
/*!*******************************************************!*\
  !*** ./src/services/email-service/user-magic-link.js ***!
  \*******************************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

const {
  sendEmail
} = __webpack_require__(/*! ./utils */ "./src/services/email-service/utils.js");

module.exports = async function sendMagicLinkLogin({
  loginLink,
  email
}) {
  try {
    const mjml2html = __webpack_require__(/*! mjml */ "mjml");

    const {
      html
    } = mjml2html(`
      <mjml>
        <mj-body>
          <mj-section>
            <mj-column>
              <mj-text>Hi there! Simply follow the link below to login.</mj-text>
              <mj-button href="${loginLink}" align="left">Click here to login</mj-button>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `);
    await sendEmail({
      to: email,
      subject: "Magic link login",
      html
    });
    return {
      success: true
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      error
    };
  }
};

/***/ }),

/***/ "./src/services/email-service/utils.js":
/*!*********************************************!*\
  !*** ./src/services/email-service/utils.js ***!
  \*********************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const invariant = __webpack_require__(/*! invariant */ "invariant");

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM;
module.exports = {
  sendEmail(args) {
    invariant(SENDGRID_API_KEY, "process.env.SENDGRID_API_KEY not defined");
    invariant(EMAIL_FROM, "process.env.EMAIL_FROM is not defined");

    const sgMail = __webpack_require__(/*! @sendgrid/mail */ "@sendgrid/mail");

    sgMail.setApiKey(SENDGRID_API_KEY);
    return sgMail.send(_objectSpread({
      from: EMAIL_FROM
    }, args));
  }

};

/***/ }),

/***/ "./src/services/payment-providers/klarna/capture.js":
/*!**********************************************************!*\
  !*** ./src/services/payment-providers/klarna/capture.js ***!
  \**********************************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

/**
 * An example of how to capture an amount for on an
 * order. You would typically do this as a response to
 * an update of a Fulfilment Pipelane Stage change in
 * Crystallize (https://crystallize.com/learn/developer-guides/order-api/fulfilment-pipelines)
 */
module.exports = async function klarnaCapture({
  crystallizeOrderId
}) {
  const crystallize = __webpack_require__(/*! ../../crystallize */ "./src/services/crystallize/index.js");

  const {
    getClient
  } = __webpack_require__(/*! ./utils */ "./src/services/payment-providers/klarna/utils.js"); // Retrieve the Crystallize order


  const crystallizeOrder = await crystallize.orders.get(crystallizeOrderId);
  const klarnaPayment = crystallizeOrder.payment.find(p => p.provider === "klarna");

  if (!klarnaPayment) {
    throw new Error(`Order ${crystallizeOrderId} has no Klarna payment`);
  }

  const klarnaOrderId = klarnaPayment.orderId;

  if (!klarnaOrderId) {
    throw new Error(`Order ${crystallizeOrderId} has no klarnaOrderId`);
  }

  const klarnaClient = await getClient(); // Capture the full amount for the order

  const {
    error,
    response
  } = await klarnaClient.ordermanagementV1.captures.capture(klarnaOrderId);
  console.log(error, response);
  /**
   * You would typically also move the order in the
   * fulfilment pipeline from a stage called e.g.
   * "created" to "purchased" here
   */
};

/***/ }),

/***/ "./src/services/payment-providers/klarna/index.js":
/*!********************************************************!*\
  !*** ./src/services/payment-providers/klarna/index.js ***!
  \********************************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

const KLARNA_USERNAME = process.env.KLARNA_USERNAME;
const KLARNA_PASSWORD = process.env.KLARNA_PASSWORD;

const {
  getClient
} = __webpack_require__(/*! ./utils */ "./src/services/payment-providers/klarna/utils.js");

const renderCheckout = __webpack_require__(/*! ./render-checkout */ "./src/services/payment-providers/klarna/render-checkout.js");

const push = __webpack_require__(/*! ./push */ "./src/services/payment-providers/klarna/push.js");

const capture = __webpack_require__(/*! ./capture */ "./src/services/payment-providers/klarna/capture.js");

module.exports = {
  enabled: Boolean(KLARNA_USERNAME && KLARNA_PASSWORD),
  frontendConfig: {},
  getClient,
  renderCheckout,
  push,
  capture
};

/***/ }),

/***/ "./src/services/payment-providers/klarna/push.js":
/*!*******************************************************!*\
  !*** ./src/services/payment-providers/klarna/push.js ***!
  \*******************************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

module.exports = async function klarnaPush({
  crystallizeOrderId,
  klarnaOrderId
}) {
  const {
    getClient
  } = __webpack_require__(/*! ./utils */ "./src/services/payment-providers/klarna/utils.js");

  console.log("Klarna push", {
    crystallizeOrderId,
    klarnaOrderId
  });
  const klarnaClient = await getClient(); // Retrieve the Klarna order to get the payment status
  // Acknowledge the Klarna order

  await klarnaClient.ordermanagementV1.orders.acknowledge(klarnaOrderId);
  /**
   * You would typically also move the order in the
   * fulfilment pipeline from a stage called e.g.
   * "initial" to "created" here
   */
};

/***/ }),

/***/ "./src/services/payment-providers/klarna/render-checkout.js":
/*!******************************************************************!*\
  !*** ./src/services/payment-providers/klarna/render-checkout.js ***!
  \******************************************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

module.exports = async function renderCheckout({
  checkoutModel,
  context
}) {
  const crystallize = __webpack_require__(/*! ../../crystallize */ "./src/services/crystallize/index.js");

  const basketService = __webpack_require__(/*! ../../basket-service */ "./src/services/basket-service/index.js");

  const {
    getClient
  } = __webpack_require__(/*! ./utils */ "./src/services/payment-providers/klarna/utils.js");

  const toKlarnaOrderModel = __webpack_require__(/*! ./to-klarna-order-model */ "./src/services/payment-providers/klarna/to-klarna-order-model.js");

  const {
    basketModel,
    customer,
    confirmationURL,
    termsURL,
    checkoutURL
  } = checkoutModel;
  const {
    serviceCallbackHost,
    user
  } = context;
  let {
    crystallizeOrderId,
    klarnaOrderId
  } = basketModel;
  const basket = await basketService.get({
    basketModel,
    context
  }); // Add the identifier from the current logged in user

  const customerWithCurrentLoggedInUser = _objectSpread(_objectSpread({}, customer), {}, {
    identifier: user.email
  });
  /**
   * Use a Crystallize order and the fulfilment pipelines to
   * manage the lifecycle of the order
   */


  if (crystallizeOrderId) {
    await crystallize.orders.update(crystallizeOrderId, _objectSpread(_objectSpread({}, basket), {}, {
      customer: customerWithCurrentLoggedInUser
    }));
  } else {
    const crystallizeOrder = await crystallize.orders.create(_objectSpread(_objectSpread({}, basket), {}, {
      customer: customerWithCurrentLoggedInUser
    }));
    crystallizeOrderId = crystallizeOrder.id;
  } // Setup the confirmation URL


  const confirmation = new URL(confirmationURL.replace("{crystallizeOrderId}", crystallizeOrderId));
  confirmation.searchParams.append("klarnaOrderId", "{checkout.order.id}");

  const validKlarnaOrderModel = _objectSpread(_objectSpread({}, toKlarnaOrderModel(basket)), {}, {
    purchase_country: "NO",
    purchase_currency: basket.total.currency || "NOK",
    locale: "no-nb",
    merchant_urls: {
      terms: termsURL,
      checkout: checkoutURL,
      confirmation: confirmation.toString(),
      push: `${serviceCallbackHost}/webhooks/payment-providers/klarna/push?crystallizeOrderId=${crystallizeOrderId}&klarnaOrderId={checkout.order.id}`
    }
  });

  const klarnaClient = await getClient();
  /**
   * Hold the HTML snippet that will be used on the
   * frontend to display the Klarna checkout
   */

  let html = "";
  /**
   * There is already a Klarna order id for this user
   * session, let's use that and not create a new one
   */

  if (klarnaOrderId) {
    const {
      error,
      response
    } = await klarnaClient.checkoutV3.updateOrder(klarnaOrderId, validKlarnaOrderModel);

    if (!error) {
      html = response.html_snippet;
      klarnaOrderId = response.order_id;
    } else {
      throw new Error(error);
    }
  } else {
    const {
      error,
      response
    } = await klarnaClient.checkoutV3.createOrder(validKlarnaOrderModel);

    if (!error) {
      html = response.html_snippet;
      klarnaOrderId = response.order_id;
    } else {
      throw new Error(error);
    }
  }
  /**
   * The Crystallize order creating is asynchronous, so we have
   * to wait for the order to be fully persisted
   */


  await crystallize.orders.waitForOrderToBePersistated({
    id: crystallizeOrderId
  }); // Tag the Crystallize order with the Klarna order id

  await crystallize.orders.update(crystallizeOrderId, _objectSpread(_objectSpread({}, basket), {}, {
    payment: [{
      provider: "klarna",
      klarna: {
        orderId: klarnaOrderId
      }
    }]
  }));
  return {
    html,
    klarnaOrderId,
    crystallizeOrderId
  };
};

/***/ }),

/***/ "./src/services/payment-providers/klarna/to-klarna-order-model.js":
/*!************************************************************************!*\
  !*** ./src/services/payment-providers/klarna/to-klarna-order-model.js ***!
  \************************************************************************/
/***/ (function(module) {

module.exports = function crystallizeToKlarnaOrderModel(basket) {
  const {
    total,
    cart
  } = basket;
  const order_amount = total.gross * 100;
  return {
    order_amount,
    order_tax_amount: order_amount - total.net * 100,
    order_lines: cart.map(({
      sku,
      quantity,
      price,
      name,
      productId,
      productVariantId,
      imageUrl
    }) => {
      const {
        gross,
        net,
        tax
      } = price;
      const unit_price = gross * 100;

      if (sku.startsWith("--voucher--")) {
        return {
          reference: sku,
          name,
          quantity: 1,
          unit_price,
          total_amount: unit_price,
          total_tax_amount: 0,
          tax_rate: 0,
          type: "discount"
        };
      }

      const total_amount = unit_price * quantity;
      const total_tax_amount = total_amount - net * quantity * 100;
      return {
        name,
        reference: sku,
        unit_price,
        quantity,
        total_amount,
        total_tax_amount,
        type: "physical",
        tax_rate: tax.percent * 100,
        image_url: imageUrl,
        merchant_data: JSON.stringify({
          productId,
          productVariantId,
          taxGroup: tax
        })
      };
    })
  };
};

/***/ }),

/***/ "./src/services/payment-providers/klarna/utils.js":
/*!********************************************************!*\
  !*** ./src/services/payment-providers/klarna/utils.js ***!
  \********************************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

/**
 * Read more about how to talk to the Klarna API here:
 * https://developers.klarna.com/api/#introduction
 */
const invariant = __webpack_require__(/*! invariant */ "invariant");

const KLARNA_USERNAME = process.env.KLARNA_USERNAME;
const KLARNA_PASSWORD = process.env.KLARNA_PASSWORD;
let client;
module.exports = {
  getClient: () => {
    const {
      Klarna
    } = __webpack_require__(/*! @crystallize/node-klarna */ "@crystallize/node-klarna");

    invariant(KLARNA_USERNAME, "process.env.KLARNA_USERNAME is not defined");
    invariant(KLARNA_PASSWORD, "process.env.KLARNA_PASSWORD is not defined");

    if (!client && KLARNA_USERNAME && KLARNA_PASSWORD) {
      client = new Klarna({
        username: KLARNA_USERNAME,
        password: KLARNA_PASSWORD,
        apiEndpoint: "api.playground.klarna.com"
      });
    }

    return client;
  }
};

/***/ }),

/***/ "./src/services/payment-providers/mollie/create-payment.js":
/*!*****************************************************************!*\
  !*** ./src/services/payment-providers/mollie/create-payment.js ***!
  \*****************************************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

module.exports = async function createMolliePayment({
  checkoutModel,
  context
}) {
  const basketService = __webpack_require__(/*! ../../basket-service */ "./src/services/basket-service/index.js");

  const crystallize = __webpack_require__(/*! ../../crystallize */ "./src/services/crystallize/index.js");

  const {
    getClient
  } = __webpack_require__(/*! ./utils */ "./src/services/payment-providers/mollie/utils.js");

  const {
    basketModel,
    customer,
    confirmationURL
  } = checkoutModel;
  const {
    serviceCallbackHost,
    user
  } = context; // Add the identifier from the current logged in user

  const customerWithCurrentLoggedInUser = _objectSpread(_objectSpread({}, customer), {}, {
    identifier: user.email
  });

  const basket = await basketService.get({
    basketModel,
    context
  });
  const {
    total
  } = basket;
  let {
    crystallizeOrderId
  } = basketModel;
  const isSubscription = false;
  /* Use a Crystallize order and the fulfilment pipelines to
   * manage the lifecycle of the order
   */

  if (crystallizeOrderId) {
    await crystallize.orders.update(crystallizeOrderId, _objectSpread(_objectSpread({}, basket), {}, {
      customer: customerWithCurrentLoggedInUser,
      meta: [{
        key: "isSubscription",
        value: isSubscription ? "yes" : "no"
      }]
    }));
  } else {
    const crystallizeOrder = await crystallize.orders.create(_objectSpread(_objectSpread({}, basket), {}, {
      customer: customerWithCurrentLoggedInUser,
      meta: [{
        key: "isSubscription",
        value: isSubscription ? "yes" : "no"
      }]
    }));
    crystallizeOrderId = crystallizeOrder.id;
  }

  const mollieClient = await getClient();
  const mollieCustomer = await mollieClient.customers.create({
    name: `${customer.firstName} ${customer.lastName}`.trim() || "Jane Doe",
    email: customer.addresses[0].email
  });
  const confirmation = new URL(confirmationURL.replace("{crystallizeOrderId}", crystallizeOrderId));
  const validMollieOrder = {
    amount: {
      currency: process.env.MOLLIE_DEFAULT_CURRENCY || total.currency.toUpperCase(),
      value: total.gross.toFixed(2)
    },
    customerId: mollieCustomer.id,
    sequenceType: "first",
    description: "Mollie test transaction",
    redirectUrl: confirmation.toString(),
    webhookUrl: `${serviceCallbackHost}/webhooks/payment-providers/mollie/order-update`,
    metadata: {
      crystallizeOrderId
    }
  };
  const mollieOrderResponse = await mollieClient.payments.create(validMollieOrder);

  if (isSubscription) {
    await mollieClient.customers_mandates.get(mollieOrderResponse.mandateId, {
      customerId: mollieCustomer.id
    }); // Define the start date for the subscription

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 15);
    startDate.toISOString().split("T")[0];
    await mollieClient.customers_subscriptions.create({
      customerId: mollieCustomer.id,
      amount: validMollieOrder.amount,
      times: 1,
      interval: "1 month",
      startDate,
      description: "Mollie Test subscription",
      webhookUrl: `${serviceCallbackHost}/webhooks/payment-providers/mollie/subscription-renewal`,
      metadata: {}
    });
  }

  return {
    success: true,
    checkoutLink: mollieOrderResponse._links.checkout.href,
    crystallizeOrderId
  };
};

/***/ }),

/***/ "./src/services/payment-providers/mollie/index.js":
/*!********************************************************!*\
  !*** ./src/services/payment-providers/mollie/index.js ***!
  \********************************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

const {
  getClient
} = __webpack_require__(/*! ./utils */ "./src/services/payment-providers/mollie/utils.js");

const toCrystallizeOrderModel = __webpack_require__(/*! ./to-crystallize-order-model */ "./src/services/payment-providers/mollie/to-crystallize-order-model.js");

const createPayment = __webpack_require__(/*! ./create-payment */ "./src/services/payment-providers/mollie/create-payment.js");

module.exports = {
  enabled: Boolean(process.env.MOLLIE_API_KEY),
  frontendConfig: {},
  getClient,
  toCrystallizeOrderModel,
  createPayment
};

/***/ }),

/***/ "./src/services/payment-providers/mollie/to-crystallize-order-model.js":
/*!*****************************************************************************!*\
  !*** ./src/services/payment-providers/mollie/to-crystallize-order-model.js ***!
  \*****************************************************************************/
/***/ (function(module) {

/**
 * TODO: review what happens to the General Order Vat Group on multiple tax groups
 * on order (mult. items having diff vatTypes, is it a thing?)
 */
module.exports = function mollieToCrystallizeOrderModel({
  mollieOrder,
  mollieCustomer
}) {
  const customerName = mollieCustomer.name.split(" ");
  return {
    customer: {
      identifier: mollieCustomer.email,
      firstName: customerName[0],
      middleName: customerName.slice(1, customerName.length - 1).join(),
      lastName: customerName[customerName.length - 1],
      birthDate: Date,
      addresses: [{
        type: "billing",
        firstName: customerName[0],
        middleName: customerName.slice(1, customerName.length - 1).join(),
        lastName: customerName[customerName.length - 1],
        street: "Test line1",
        street2: "Test line2",
        postalCode: "Test postal_code",
        city: "Test city",
        state: "Test state",
        country: "Test country",
        phone: "Test Phone",
        email: mollieCustomer.email
      }, {
        type: "delivery",
        firstName: customerName[0],
        middleName: customerName.slice(1, customerName.length - 1).join(),
        lastName: customerName[customerName.length - 1],
        street: "Test line1",
        street2: "Test line2",
        postalCode: "Test postal_code",
        city: "Test city",
        state: "Test state",
        country: "Test country",
        phone: "Test Phone",
        email: mollieCustomer.email
      }]
    },
    payment: [{
      provider: "custom",
      custom: {
        properties: [{
          property: "resource",
          value: mollieOrder.resource
        }, {
          property: "resource_id",
          value: mollieOrder.id
        }, {
          property: "mode",
          value: mollieOrder.mode
        }, {
          property: "method",
          value: mollieOrder.method
        }, {
          property: "status",
          value: mollieOrder.status
        }, {
          property: "profileId",
          value: mollieOrder.profileId
        }, {
          property: "mandateId",
          value: mollieOrder.mandateId
        }, {
          property: "customerId",
          value: mollieOrder.customerId
        }, {
          property: "sequenceType",
          value: mollieOrder.sequenceType
        }]
      }
    }]
  };
};

/***/ }),

/***/ "./src/services/payment-providers/mollie/utils.js":
/*!********************************************************!*\
  !*** ./src/services/payment-providers/mollie/utils.js ***!
  \********************************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

const invariant = __webpack_require__(/*! invariant */ "invariant");

const MOLLIE_API_KEY = process.env.MOLLIE_API_KEY;
let client;
module.exports = {
  getClient: () => {
    invariant(MOLLIE_API_KEY, "process.env.MOLLIE_API_KEY is not defined");

    if (!client) {
      const {
        createMollieClient
      } = __webpack_require__(/*! @mollie/api-client */ "@mollie/api-client");

      client = createMollieClient({
        apiKey: process.env.MOLLIE_API_KEY
      });
    }

    return client;
  }
};

/***/ }),

/***/ "./src/services/payment-providers/stripe/confirm-order.js":
/*!****************************************************************!*\
  !*** ./src/services/payment-providers/stripe/confirm-order.js ***!
  \****************************************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

module.exports = async function confirmOrder({
  paymentIntentId,
  checkoutModel,
  context
}) {
  var _checkoutModel$custom, _checkoutModel$custom2, _checkoutModel$custom3;

  const crystallize = __webpack_require__(/*! ../../crystallize */ "./src/services/crystallize/index.js");

  const basketService = __webpack_require__(/*! ../../basket-service */ "./src/services/basket-service/index.js");

  const toCrystallizeOrderModel = __webpack_require__(/*! ./to-crystallize-order-model */ "./src/services/payment-providers/stripe/to-crystallize-order-model.js");

  const {
    basketModel
  } = checkoutModel;
  const {
    user
  } = context;
  const basket = await basketService.get({
    basketModel,
    context
  }); // Prepare a valid model for Crystallize order intake

  const crystallizeOrderModel = await toCrystallizeOrderModel({
    basket,
    checkoutModel,
    paymentIntentId,
    customerIdentifier: (user === null || user === void 0 ? void 0 : user.email) || (checkoutModel === null || checkoutModel === void 0 ? void 0 : (_checkoutModel$custom = checkoutModel.customer) === null || _checkoutModel$custom === void 0 ? void 0 : (_checkoutModel$custom2 = _checkoutModel$custom.addresses) === null || _checkoutModel$custom2 === void 0 ? void 0 : (_checkoutModel$custom3 = _checkoutModel$custom2[0]) === null || _checkoutModel$custom3 === void 0 ? void 0 : _checkoutModel$custom3.email) || ""
  });
  /**
   * Record the order in Crystallize
   * Manage the order lifecycle by using the fulfilment pipelines:
   * https://crystallize.com/learn/user-guides/orders-and-fulfilment
   */

  const order = await crystallize.orders.create(crystallizeOrderModel);
  return {
    success: true,
    orderId: order.id
  };
};

/***/ }),

/***/ "./src/services/payment-providers/stripe/create-payment-intent.js":
/*!************************************************************************!*\
  !*** ./src/services/payment-providers/stripe/create-payment-intent.js ***!
  \************************************************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

module.exports = async function createPaymentIntent({
  checkoutModel,
  confirm = false,
  paymentMethodId,
  context
}) {
  const basketService = __webpack_require__(/*! ../../basket-service */ "./src/services/basket-service/index.js");

  const {
    getClient
  } = __webpack_require__(/*! ./utils */ "./src/services/payment-providers/stripe/utils.js");

  const {
    basketModel
  } = checkoutModel;
  const basket = await basketService.get({
    basketModel,
    context
  });
  const paymentIntent = await getClient().paymentIntents.create({
    amount: basket.total.gross * 100,
    currency: basket.total.currency,
    confirm,
    payment_method: paymentMethodId
  });
  return paymentIntent;
};

/***/ }),

/***/ "./src/services/payment-providers/stripe/index.js":
/*!********************************************************!*\
  !*** ./src/services/payment-providers/stripe/index.js ***!
  \********************************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

const createPaymentIntent = __webpack_require__(/*! ./create-payment-intent */ "./src/services/payment-providers/stripe/create-payment-intent.js");

const confirmOrder = __webpack_require__(/*! ./confirm-order */ "./src/services/payment-providers/stripe/confirm-order.js");

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY;
module.exports = {
  enabled: Boolean(STRIPE_SECRET_KEY && STRIPE_PUBLISHABLE_KEY),
  // The required frontend config
  frontendConfig: {
    publishableKey: STRIPE_PUBLISHABLE_KEY
  },
  createPaymentIntent,
  confirmOrder
};

/***/ }),

/***/ "./src/services/payment-providers/stripe/to-crystallize-order-model.js":
/*!*****************************************************************************!*\
  !*** ./src/services/payment-providers/stripe/to-crystallize-order-model.js ***!
  \*****************************************************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

module.exports = async function stripeToCrystallizeOrderModel({
  basket,
  checkoutModel,
  paymentIntentId,
  customerIdentifier
}) {
  const {
    getClient
  } = __webpack_require__(/*! ./utils */ "./src/services/payment-providers/stripe/utils.js");

  const paymentIntent = await getClient().paymentIntents.retrieve(paymentIntentId);
  const {
    data
  } = paymentIntent.charges;
  const charge = data[0];
  const customerName = charge.billing_details.name.split(" ");
  let email = charge.receipt_email;

  if (!email && checkoutModel.customer && checkoutModel.customer.addresses) {
    const addressWithEmail = checkoutModel.customer.addresses.find(a => !!a.email);

    if (addressWithEmail) {
      email = addressWithEmail.email;
    }
  }

  const meta = [];

  if (paymentIntent.merchant_data) {
    meta.push({
      key: "stripeMerchantData",
      value: JSON.stringify(paymentIntent.merchant_data)
    });
  }

  return {
    cart: basket.cart,
    total: basket.total,
    meta,
    customer: {
      identifier: customerIdentifier,
      firstName: customerName[0],
      middleName: customerName.slice(1, customerName.length - 1).join(),
      lastName: customerName[customerName.length - 1],
      birthDate: Date,
      addresses: [{
        type: "billing",
        firstName: customerName[0],
        middleName: customerName.slice(1, customerName.length - 1).join(),
        lastName: customerName[customerName.length - 1],
        street: charge.billing_details.address.line1,
        street2: charge.billing_details.address.line2,
        postalCode: charge.billing_details.address.postal_code,
        city: charge.billing_details.address.city,
        state: charge.billing_details.address.state,
        country: charge.billing_details.address.country,
        phone: charge.billing_details.phone,
        email
      }, {
        type: "delivery",
        firstName: customerName[0],
        middleName: customerName.slice(1, customerName.length - 1).join(),
        lastName: customerName[customerName.length - 1],
        street: charge.billing_details.address.line1,
        street2: charge.billing_details.address.line2,
        postalCode: charge.billing_details.address.postal_code,
        city: charge.billing_details.address.city,
        state: charge.billing_details.address.state,
        country: charge.billing_details.address.country,
        phone: charge.billing_details.phone,
        email
      }]
    },
    payment: [{
      provider: "stripe",
      stripe: {
        stripe: charge.id,
        customerId: charge.customer,
        orderId: charge.payment_intent,
        paymentMethod: charge.payment_method_details.type,
        paymentMethodId: charge.payment_method,
        paymentIntentId: charge.payment_intent,
        subscriptionId: charge.subscription,
        metadata: ""
      }
    }]
  };
};

/***/ }),

/***/ "./src/services/payment-providers/stripe/utils.js":
/*!********************************************************!*\
  !*** ./src/services/payment-providers/stripe/utils.js ***!
  \********************************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

const invariant = __webpack_require__(/*! invariant */ "invariant");

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
let client;
module.exports = {
  getClient: () => {
    invariant(STRIPE_SECRET_KEY, "process.env.STRIPE_SECRET_KEY is not defined");

    if (!client) {
      const stripeSdk = __webpack_require__(/*! stripe */ "stripe");

      client = stripeSdk(STRIPE_SECRET_KEY);
    }

    return client;
  }
};

/***/ }),

/***/ "./src/services/payment-providers/vipps/fallback.js":
/*!**********************************************************!*\
  !*** ./src/services/payment-providers/vipps/fallback.js ***!
  \**********************************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

module.exports = async function vippsFallback({
  crystallizeOrderId,
  onSuccessURL,
  onErrorURL
}) {
  const crystallize = __webpack_require__(/*! ../../crystallize */ "./src/services/crystallize/index.js");

  const {
    getClient
  } = __webpack_require__(/*! ./utils */ "./src/services/payment-providers/vipps/utils.js");

  let redirectTo = "";
  const vippsClient = await getClient(); // Retrieve the Vipps order to get transaction details

  const order = await vippsClient.getOrderDetails({
    orderId: crystallizeOrderId
  });
  const [lastTransactionLogEntry] = order.transactionLogHistory.sort((a, b) => new Date(b.timeStamp) - new Date(a.timeStamp));
  /**
   * If the transaction logs last entry has status
   * RESERVE, then the amount has been successfully
   * reserved on the user account, and we can show
   * the confirmation page
   */

  if (lastTransactionLogEntry.operation === "RESERVE" && lastTransactionLogEntry.operationSuccess) {
    redirectTo = onSuccessURL;
    /**
     * At this point we have user details from Vipps, which
     * makes it a good time to update the Crystallize order
     */

    const {
      userDetails: {
        userId,
        firstName,
        lastName,
        email,
        mobileNumber: phone
      } = {},
      shippingDetails: {
        address: {
          addressLine1: street,
          addressLine2: street2,
          postCode: postalCode,
          city,
          country
        } = {}
      } = {}
    } = order;
    await crystallize.orders.update(crystallizeOrderId, {
      payment: [{
        provider: "custom",
        custom: {
          properties: [{
            property: "PaymentProvider",
            value: "Vipps"
          }, {
            property: "Vipps orderId",
            value: crystallizeOrderId
          }, {
            property: "Vipps userId",
            value: userId
          }]
        }
      }],
      customer: {
        identifier: email,
        firstName,
        lastName,
        addresses: [{
          type: "delivery",
          email,
          firstName,
          lastName,
          phone,
          street,
          street2,
          postalCode,
          city,
          country
        }]
      }
    });
  } else {
    redirectTo = onErrorURL;
    console.log(JSON.stringify(lastTransactionLogEntry, null, 2));
  }

  return {
    redirectTo
  };
};

/***/ }),

/***/ "./src/services/payment-providers/vipps/index.js":
/*!*******************************************************!*\
  !*** ./src/services/payment-providers/vipps/index.js ***!
  \*******************************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

/**
 * Vipps (https://vipps.no)
 *
 * Getting started:
 * https://crystallize.com/learn/open-source/payment-gateways/vipps
 */
const VIPPS_CLIENT_ID = process.env.VIPPS_CLIENT_ID;
const VIPPS_CLIENT_SECRET = process.env.VIPPS_CLIENT_SECRET;
const VIPPS_MERCHANT_SERIAL = process.env.VIPPS_MERCHANT_SERIAL;
const VIPPS_SUB_KEY = process.env.VIPPS_SUB_KEY;

const initiatePayment = __webpack_require__(/*! ./initiate-payment */ "./src/services/payment-providers/vipps/initiate-payment.js");

const fallback = __webpack_require__(/*! ./fallback */ "./src/services/payment-providers/vipps/fallback.js");

const orderUpdate = __webpack_require__(/*! ./order-update */ "./src/services/payment-providers/vipps/order-update.js");

const userConsentRemoval = __webpack_require__(/*! ./user-consent-removal */ "./src/services/payment-providers/vipps/user-consent-removal.js");

module.exports = {
  enabled: Boolean(VIPPS_CLIENT_ID && VIPPS_CLIENT_SECRET && VIPPS_MERCHANT_SERIAL && VIPPS_SUB_KEY),
  frontendConfig: {},
  initiatePayment,
  fallback,
  orderUpdate,
  userConsentRemoval
};

/***/ }),

/***/ "./src/services/payment-providers/vipps/initiate-payment.js":
/*!******************************************************************!*\
  !*** ./src/services/payment-providers/vipps/initiate-payment.js ***!
  \******************************************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const invariant = __webpack_require__(/*! invariant */ "invariant");

const VIPPS_MERCHANT_SERIAL = process.env.VIPPS_MERCHANT_SERIAL;

module.exports = async function initiateVippsPayment({
  checkoutModel,
  context
}) {
  const basketService = __webpack_require__(/*! ../../basket-service */ "./src/services/basket-service/index.js");

  const crystallize = __webpack_require__(/*! ../../crystallize */ "./src/services/crystallize/index.js");

  const {
    getClient
  } = __webpack_require__(/*! ./utils */ "./src/services/payment-providers/vipps/utils.js");

  invariant(VIPPS_MERCHANT_SERIAL, "process.env.VIPPS_MERCHANT_SERIAL is undefined");
  const {
    basketModel,
    customer,
    confirmationURL,
    checkoutURL
  } = checkoutModel;
  const {
    serviceCallbackHost,
    user
  } = context; // Add the identifier from the current logged in user

  const customerWithCurrentLoggedInUser = _objectSpread(_objectSpread({}, customer), {}, {
    identifier: user.email
  });

  const basket = await basketService.get({
    basketModel,
    context
  });
  const {
    total
  } = basket;
  /* Use a Crystallize order and the fulfilment pipelines to
   * manage the lifecycle of the order
   */

  const crystallizeOrder = await crystallize.orders.create(_objectSpread(_objectSpread({}, basket), {}, {
    customer: customerWithCurrentLoggedInUser
  }));
  const crystallizeOrderId = crystallizeOrder.id;
  /**
   * The Vipps "fallback" url, is where the user will be redirected
   * to after completing the Vipps checkout.
   */

  const fallBackURL = new URL(`${serviceCallbackHost}/webhooks/payment-providers/vipps/fallback/${crystallizeOrderId}`);
  fallBackURL.searchParams.append("confirmation", encodeURIComponent(confirmationURL.replace("{crystallizeOrderId}", crystallizeOrderId)));
  fallBackURL.searchParams.append("checkout", encodeURIComponent(checkoutURL));
  const vippsClient = await getClient();
  const vippsResponse = await vippsClient.initiatePayment({
    order: {
      merchantInfo: {
        merchantSerialNumber: VIPPS_MERCHANT_SERIAL,
        fallBack: fallBackURL.toString(),
        callbackPrefix: `${serviceCallbackHost}/webhooks/payment-providers/vipps/order-update`,
        shippingDetailsPrefix: `${serviceCallbackHost}/webhooks/payment-providers/vipps/shipping`,
        consentRemovalPrefix: `${serviceCallbackHost}/webhooks/payment-providers/vipps/constent-removal`,
        paymentType: "eComm Express Payment",
        isApp: false,
        staticShippingDetails: [// Provide a default shipping method
        {
          isDefault: "Y",
          priority: 0,
          shippingCost: 0,
          shippingMethod: "Posten Servicepakke",
          shippingMethodId: "posten-servicepakke"
        }]
      },
      customerInfo: {},
      transaction: {
        orderId: crystallizeOrderId,
        amount: parseInt(total.gross * 100, 10),
        transactionText: "Crystallize test transaction"
      }
    }
  });
  return {
    success: true,
    checkoutLink: vippsResponse.url,
    crystallizeOrderId
  };
};

/***/ }),

/***/ "./src/services/payment-providers/vipps/order-update.js":
/*!**************************************************************!*\
  !*** ./src/services/payment-providers/vipps/order-update.js ***!
  \**************************************************************/
/***/ (function(module) {

module.exports = async function vippsOrderUpdate({
  crystallizeOrderId
}) {
  console.log("VIPPS order update");
  console.log({
    crystallizeOrderId
  }); // const { getClient } = require("./utils");
  // const vippsClient = await getClient();
  // Retrieve the Vipps order transaction details
  // const order = await vippsClient.getOrderDetails({
  //   orderId: crystallizeOrderId,
  // });
};

/***/ }),

/***/ "./src/services/payment-providers/vipps/user-consent-removal.js":
/*!**********************************************************************!*\
  !*** ./src/services/payment-providers/vipps/user-consent-removal.js ***!
  \**********************************************************************/
/***/ (function(module) {

module.exports = async function vippsUserConsentRemoval({
  vippsUserId
}) {
  // const { getClient } = require("./utils");
  // const vippsClient = await getClient();
  console.log("VIPPS user consent removal");
  console.log({
    vippsUserId
  });
};

/***/ }),

/***/ "./src/services/payment-providers/vipps/utils.js":
/*!*******************************************************!*\
  !*** ./src/services/payment-providers/vipps/utils.js ***!
  \*******************************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

const invariant = __webpack_require__(/*! invariant */ "invariant");

const VIPPS_CLIENT_ID = process.env.VIPPS_CLIENT_ID;
const VIPPS_CLIENT_SECRET = process.env.VIPPS_CLIENT_SECRET;
const VIPPS_SUB_KEY = process.env.VIPPS_SUB_KEY;
let client;
module.exports = {
  getClient: () => {
    invariant(VIPPS_CLIENT_ID, "process.env.VIPPS_CLIENT_ID is not defined");
    invariant(VIPPS_CLIENT_SECRET, "process.env.VIPPS_CLIENT_SECRET is not defined");
    invariant(VIPPS_SUB_KEY, "process.env.VIPPS_SUB_KEY is not defined");

    if (!client) {
      const VippsClient = __webpack_require__(/*! @crystallize/node-vipps */ "@crystallize/node-vipps");

      client = new VippsClient({
        testDrive: true,
        id: VIPPS_CLIENT_ID,
        secret: VIPPS_CLIENT_SECRET,
        subscriptionId: VIPPS_SUB_KEY
      });
    }

    return client;
  }
};

/***/ }),

/***/ "./src/services/user-service/index.js":
/*!********************************************!*\
  !*** ./src/services/user-service/index.js ***!
  \********************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

const invariant = __webpack_require__(/*! invariant */ "invariant");

const crystallize = __webpack_require__(/*! ../crystallize */ "./src/services/crystallize/index.js");
/**
 * Todo: link to good JWT intro
 */


const JWT_SECRET = process.env.JWT_SECRET; // Cookie config for user JWTs

const COOKIE_USER_TOKEN_NAME = "user-token";
const COOKIE_USER_TOKEN_MAX_AGE = 60 * 60 * 24;
const COOKIE_REFRESH_TOKEN_NAME = "user-token-refresh";
const COOKIE_REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 7;

async function getUser({
  context
}) {
  const userInContext = context.user;
  const user = {
    isLoggedIn: Boolean(userInContext && "email" in userInContext),
    email: userInContext && userInContext.email,
    logoutLink: `${context.publicHost}/user/logout`
  };

  if (user && user.isLoggedIn) {
    const crystallizeCustomer = await crystallize.customers.get({
      identifier: user.email
    });

    if (crystallizeCustomer) {
      Object.assign(user, crystallizeCustomer);
    }
  }

  return user;
}

module.exports = {
  COOKIE_USER_TOKEN_NAME,
  COOKIE_REFRESH_TOKEN_NAME,
  COOKIE_USER_TOKEN_MAX_AGE,
  COOKIE_REFRESH_TOKEN_MAX_AGE,

  authenticate(token) {
    invariant(JWT_SECRET, "process.env.JWT_SECRET is not defined");

    if (!token) {
      return null;
    }

    const jwt = __webpack_require__(/*! jsonwebtoken */ "jsonwebtoken");

    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded) {
      return null;
    }

    return {
      email: decoded.email
    };
  },

  async sendMagicLink({
    email,
    redirectURLAfterLogin,
    context
  }) {
    invariant(JWT_SECRET, "process.env.JWT_SECRET is not defined");
    const {
      publicHost
    } = context;
    const crystallizeCustomer = await crystallize.customers.get({
      identifier: email
    });
    /**
     * If there is no customer record in Crystallize, we will
     * create one.
     *
     * You can choose NOT to create a customer at this point,
     * and prohibit logins for none customers
     */

    if (!crystallizeCustomer) {
      // return {
      //   success: false,
      //   error: "CUSTOMER_NOT_FOUND",
      // };
      const emailParts = email.split("@");
      await crystallize.customers.create({
        identifier: email,
        firstName: emailParts[0],
        lastName: emailParts[1]
      });
    }
    /**
     * This is the page responsible of receiving the magic
     * link token, and then calling the validateMagicLinkToken
     * function from userService.
     */


    const loginLink = new URL(`${publicHost}/user/login-magic-link`);
    /**
     * Add the JWT to the callback url
     * When the link is visited, we can validate the token
     * again in the validateMagicLinkToken method
     */

    const jwt = __webpack_require__(/*! jsonwebtoken */ "jsonwebtoken");

    loginLink.searchParams.append("token", jwt.sign({
      email,
      redirectURLAfterLogin
    }, JWT_SECRET, {
      expiresIn: "1h"
    }));

    const emailService = __webpack_require__(/*! ../email-service */ "./src/services/email-service/index.js");

    const {
      success
    } = await emailService.sendUserMagicLink({
      loginLink: loginLink.toString(),
      email
    });
    return {
      success
    };
  },

  validateMagicLinkToken(token) {
    invariant(JWT_SECRET, "process.env.JWT_SECRET is not defined");
    /**
     * Here we would want to fetch an entry matching the provided token from our
     * datastore. This boilerplate does not have a datastore connected to it yet
     * so we will just assume the token is for a real user and sign a login token
     * accordingly.
     */

    try {
      const jwt = __webpack_require__(/*! jsonwebtoken */ "jsonwebtoken");

      const decoded = jwt.verify(token, JWT_SECRET);
      const {
        email,
        redirectURLAfterLogin
      } = decoded;
      const signedLoginToken = jwt.sign({
        email
      }, JWT_SECRET, {
        expiresIn: COOKIE_USER_TOKEN_MAX_AGE
      });
      const signedLoginRefreshToken = jwt.sign({
        email
      }, JWT_SECRET, {
        expiresIn: COOKIE_REFRESH_TOKEN_MAX_AGE
      });
      return {
        success: true,
        signedLoginToken,
        COOKIE_USER_TOKEN_MAX_AGE,
        signedLoginRefreshToken,
        redirectURLAfterLogin,
        COOKIE_REFRESH_TOKEN_MAX_AGE
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        error
      };
    }
  },

  validateRefreshToken({
    refreshToken,
    email
  }) {
    if (!refreshToken || !email) {
      return false;
    }

    try {
      const jwt = __webpack_require__(/*! jsonwebtoken */ "jsonwebtoken");

      const decoded = jwt.verify(refreshToken, JWT_SECRET);

      if (decoded.email === email) {
        return jwt.sign({
          email
        }, JWT_SECRET, {
          expiresIn: COOKIE_USER_TOKEN_MAX_AGE
        });
      }
    } catch (e) {
      console.log(e);
    }

    return false;
  },

  getUser,

  async update({
    context,
    input
  }) {
    const {
      user
    } = context;

    if (!user) {
      throw new Error("No user found in context");
    }

    await crystallize.customers.update({
      identifier: user.email,
      customer: input
    });
    return getUser({
      context
    });
  }

};

/***/ }),

/***/ "./src/services/voucher-service/crystallize-vouchers-example.js":
/*!**********************************************************************!*\
  !*** ./src/services/voucher-service/crystallize-vouchers-example.js ***!
  \**********************************************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

const {
  callCatalogueApi
} = __webpack_require__(/*! ../crystallize/utils */ "./src/services/crystallize/utils.js");
/**
 * Example of how to use Crystallize to store and
 * manage vouchers.
 *
 * Expected catalogue structure:
 * _vouchers
 *  - voucher_1
 *  - voucher_2
 *  - ...
 *  - voucher_n
 *
 * Each voucher is based on the following shape
 * code (singleLine)
 * discount (choiceComponent)
 *  - percent (numeric)
 *  - amount (numeric)
 */


module.exports = async function getCrystallizeVouchers() {
  const vouchersFromCrystallize = await callCatalogueApi({
    query: `
      {
        catalogue(language: "en", path: "/vouchers") {
          children {
            name
            code: component(id: "code") {
              content {
                ... on SingleLineContent {
                  text
                }
              }
            }
            discount: component(id: "discount") {
              content {
                ... on ComponentChoiceContent {
                  selectedComponent {
                    id
                    content {
                      ... on NumericContent {
                        number
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `
  });

  if (!vouchersFromCrystallize.data || !vouchersFromCrystallize.data.catalogue) {
    return [];
  }

  return vouchersFromCrystallize.data.catalogue.children.map(voucherFromCrystallize => {
    const discountComponent = voucherFromCrystallize.discount.content.selectedComponent;
    let discountAmount = null;
    let discountPercent = null;

    if (discountComponent.id === "percent") {
      discountPercent = discountComponent.content.number;
    } else {
      discountAmount = discountComponent.content.number;
    }

    return {
      code: voucherFromCrystallize.code.content.text,
      discountAmount,
      discountPercent,
      onlyForAuthorisedUser: false
    };
  });
};

/***/ }),

/***/ "./src/services/voucher-service/index.js":
/*!***********************************************!*\
  !*** ./src/services/voucher-service/index.js ***!
  \***********************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

const getCrystallizeVouchers = __webpack_require__(/*! ./crystallize-vouchers-example */ "./src/services/voucher-service/crystallize-vouchers-example.js");
/**
 * Example of a voucher register
 * You can customise this to call an external service
 * or keep static vouchers like this
 */


const voucherRegister = [{
  code: "ok-deal",
  discountAmount: 2,
  discountPercent: null,
  onlyForAuthorisedUser: false
}, {
  code: "fair-deal",
  discountAmount: null,
  discountPercent: 5,
  onlyForAuthorisedUser: false
}, {
  code: "awesome-deal-logged-in",
  discountAmount: null,
  discountPercent: 10,
  onlyForAuthorisedUser: true
}, {
  code: "good-deal-logged-in",
  discountAmount: 100,
  discountPercent: null,
  onlyForAuthorisedUser: true
}];
module.exports = {
  async get({
    code,
    context
  }) {
    const {
      user
    } = context;
    const isAnonymousUser = !user || !user.email;
    const allCrystallizeVouchers = await getCrystallizeVouchers();
    const allVouchers = [...voucherRegister, ...allCrystallizeVouchers]; // As default, not all the vouchers work for anonymous users.
    // As you'll see in the configuration above, some need the user to be logged in

    if (isAnonymousUser) {
      const voucher = allVouchers.filter(v => !v.onlyForAuthorisedUser).find(v => v.code === code);
      return {
        isValid: Boolean(voucher),
        voucher
      };
    } // Search all vouchers for authenticated users


    let voucher = allVouchers.find(v => v.code === code);
    return {
      isValid: Boolean(voucher),
      voucher
    };
  }

};

/***/ }),

/***/ "@crystallize/node-klarna":
/*!*******************************************!*\
  !*** external "@crystallize/node-klarna" ***!
  \*******************************************/
/***/ (function(module) {

"use strict";
module.exports = require("@crystallize/node-klarna");;

/***/ }),

/***/ "@crystallize/node-vipps":
/*!******************************************!*\
  !*** external "@crystallize/node-vipps" ***!
  \******************************************/
/***/ (function(module) {

"use strict";
module.exports = require("@crystallize/node-vipps");;

/***/ }),

/***/ "@mollie/api-client":
/*!*************************************!*\
  !*** external "@mollie/api-client" ***!
  \*************************************/
/***/ (function(module) {

"use strict";
module.exports = require("@mollie/api-client");;

/***/ }),

/***/ "@sendgrid/mail":
/*!*********************************!*\
  !*** external "@sendgrid/mail" ***!
  \*********************************/
/***/ (function(module) {

"use strict";
module.exports = require("@sendgrid/mail");;

/***/ }),

/***/ "apollo-server-micro":
/*!**************************************!*\
  !*** external "apollo-server-micro" ***!
  \**************************************/
/***/ (function(module) {

"use strict";
module.exports = require("apollo-server-micro");;

/***/ }),

/***/ "graphql-tag":
/*!******************************!*\
  !*** external "graphql-tag" ***!
  \******************************/
/***/ (function(module) {

"use strict";
module.exports = require("graphql-tag");;

/***/ }),

/***/ "invariant":
/*!****************************!*\
  !*** external "invariant" ***!
  \****************************/
/***/ (function(module) {

"use strict";
module.exports = require("invariant");;

/***/ }),

/***/ "jsonwebtoken":
/*!*******************************!*\
  !*** external "jsonwebtoken" ***!
  \*******************************/
/***/ (function(module) {

"use strict";
module.exports = require("jsonwebtoken");;

/***/ }),

/***/ "mjml":
/*!***********************!*\
  !*** external "mjml" ***!
  \***********************/
/***/ (function(module) {

"use strict";
module.exports = require("mjml");;

/***/ }),

/***/ "node-fetch":
/*!*****************************!*\
  !*** external "node-fetch" ***!
  \*****************************/
/***/ (function(module) {

"use strict";
module.exports = require("node-fetch");;

/***/ }),

/***/ "stripe":
/*!*************************!*\
  !*** external "stripe" ***!
  \*************************/
/***/ (function(module) {

"use strict";
module.exports = require("stripe");;

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
var __webpack_exports__ = (__webpack_exec__("./pages/api/graphql.js"));
module.exports = __webpack_exports__;

})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9jcnlzdGFsbGl6ZS1hcHAvLi9saWIvY29ycy5qcyIsIndlYnBhY2s6Ly9jcnlzdGFsbGl6ZS1hcHAvLi9wYWdlcy9hcGkvZ3JhcGhxbC5qcyIsIndlYnBhY2s6Ly9jcnlzdGFsbGl6ZS1hcHAvLi9zcmMvZ3JhcGhxbC1zZXJ2ZXIvY3JlYXRlLWNvbnRleHQuanMiLCJ3ZWJwYWNrOi8vY3J5c3RhbGxpemUtYXBwLy4vc3JjL2dyYXBocWwtc2VydmVyL2luZGV4LmpzIiwid2VicGFjazovL2NyeXN0YWxsaXplLWFwcC8uL3NyYy9ncmFwaHFsLXNlcnZlci9yZXNvbHZlcnMuanMiLCJ3ZWJwYWNrOi8vY3J5c3RhbGxpemUtYXBwLy4vc3JjL2dyYXBocWwtc2VydmVyL3R5cGUtZGVmcy5qcyIsIndlYnBhY2s6Ly9jcnlzdGFsbGl6ZS1hcHAvLi9zcmMvbGliL2N1cnJlbmN5LmpzIiwid2VicGFjazovL2NyeXN0YWxsaXplLWFwcC8uL3NyYy9saWIvZ2V0LWhvc3QuanMiLCJ3ZWJwYWNrOi8vY3J5c3RhbGxpemUtYXBwLy4vc3JjL3NlcnZpY2VzL2Jhc2tldC1zZXJ2aWNlL2NhbGN1bGF0ZS12b3VjaGVyLWRpc2NvdW50LWFtb3VudC5qcyIsIndlYnBhY2s6Ly9jcnlzdGFsbGl6ZS1hcHAvLi9zcmMvc2VydmljZXMvYmFza2V0LXNlcnZpY2UvZ2V0LXByb2R1Y3RzLWZyb20tY3J5c3RhbGxpemUuanMiLCJ3ZWJwYWNrOi8vY3J5c3RhbGxpemUtYXBwLy4vc3JjL3NlcnZpY2VzL2Jhc2tldC1zZXJ2aWNlL2luZGV4LmpzIiwid2VicGFjazovL2NyeXN0YWxsaXplLWFwcC8uL3NyYy9zZXJ2aWNlcy9jcnlzdGFsbGl6ZS9jdXN0b21lcnMvY3JlYXRlLWN1c3RvbWVyLmpzIiwid2VicGFjazovL2NyeXN0YWxsaXplLWFwcC8uL3NyYy9zZXJ2aWNlcy9jcnlzdGFsbGl6ZS9jdXN0b21lcnMvZ2V0LWN1c3RvbWVyLmpzIiwid2VicGFjazovL2NyeXN0YWxsaXplLWFwcC8uL3NyYy9zZXJ2aWNlcy9jcnlzdGFsbGl6ZS9jdXN0b21lcnMvaW5kZXguanMiLCJ3ZWJwYWNrOi8vY3J5c3RhbGxpemUtYXBwLy4vc3JjL3NlcnZpY2VzL2NyeXN0YWxsaXplL2N1c3RvbWVycy91cGRhdGUtY3VzdG9tZXIuanMiLCJ3ZWJwYWNrOi8vY3J5c3RhbGxpemUtYXBwLy4vc3JjL3NlcnZpY2VzL2NyeXN0YWxsaXplL2luZGV4LmpzIiwid2VicGFjazovL2NyeXN0YWxsaXplLWFwcC8uL3NyYy9zZXJ2aWNlcy9jcnlzdGFsbGl6ZS9vcmRlcnMvY3JlYXRlLW9yZGVyLmpzIiwid2VicGFjazovL2NyeXN0YWxsaXplLWFwcC8uL3NyYy9zZXJ2aWNlcy9jcnlzdGFsbGl6ZS9vcmRlcnMvZ2V0LW9yZGVyLmpzIiwid2VicGFjazovL2NyeXN0YWxsaXplLWFwcC8uL3NyYy9zZXJ2aWNlcy9jcnlzdGFsbGl6ZS9vcmRlcnMvaW5kZXguanMiLCJ3ZWJwYWNrOi8vY3J5c3RhbGxpemUtYXBwLy4vc3JjL3NlcnZpY2VzL2NyeXN0YWxsaXplL29yZGVycy91cGRhdGUtb3JkZXIuanMiLCJ3ZWJwYWNrOi8vY3J5c3RhbGxpemUtYXBwLy4vc3JjL3NlcnZpY2VzL2NyeXN0YWxsaXplL29yZGVycy93YWl0LWZvci1vcmRlci10by1iZS1wZXJzaXN0YXRlZC5qcyIsIndlYnBhY2s6Ly9jcnlzdGFsbGl6ZS1hcHAvLi9zcmMvc2VydmljZXMvY3J5c3RhbGxpemUvdXRpbHMuanMiLCJ3ZWJwYWNrOi8vY3J5c3RhbGxpemUtYXBwLy4vc3JjL3NlcnZpY2VzL2VtYWlsLXNlcnZpY2UvaW5kZXguanMiLCJ3ZWJwYWNrOi8vY3J5c3RhbGxpemUtYXBwLy4vc3JjL3NlcnZpY2VzL2VtYWlsLXNlcnZpY2Uvb3JkZXItY29uZmlybWF0aW9uLmpzIiwid2VicGFjazovL2NyeXN0YWxsaXplLWFwcC8uL3NyYy9zZXJ2aWNlcy9lbWFpbC1zZXJ2aWNlL3VzZXItbWFnaWMtbGluay5qcyIsIndlYnBhY2s6Ly9jcnlzdGFsbGl6ZS1hcHAvLi9zcmMvc2VydmljZXMvZW1haWwtc2VydmljZS91dGlscy5qcyIsIndlYnBhY2s6Ly9jcnlzdGFsbGl6ZS1hcHAvLi9zcmMvc2VydmljZXMvcGF5bWVudC1wcm92aWRlcnMva2xhcm5hL2NhcHR1cmUuanMiLCJ3ZWJwYWNrOi8vY3J5c3RhbGxpemUtYXBwLy4vc3JjL3NlcnZpY2VzL3BheW1lbnQtcHJvdmlkZXJzL2tsYXJuYS9pbmRleC5qcyIsIndlYnBhY2s6Ly9jcnlzdGFsbGl6ZS1hcHAvLi9zcmMvc2VydmljZXMvcGF5bWVudC1wcm92aWRlcnMva2xhcm5hL3B1c2guanMiLCJ3ZWJwYWNrOi8vY3J5c3RhbGxpemUtYXBwLy4vc3JjL3NlcnZpY2VzL3BheW1lbnQtcHJvdmlkZXJzL2tsYXJuYS9yZW5kZXItY2hlY2tvdXQuanMiLCJ3ZWJwYWNrOi8vY3J5c3RhbGxpemUtYXBwLy4vc3JjL3NlcnZpY2VzL3BheW1lbnQtcHJvdmlkZXJzL2tsYXJuYS90by1rbGFybmEtb3JkZXItbW9kZWwuanMiLCJ3ZWJwYWNrOi8vY3J5c3RhbGxpemUtYXBwLy4vc3JjL3NlcnZpY2VzL3BheW1lbnQtcHJvdmlkZXJzL2tsYXJuYS91dGlscy5qcyIsIndlYnBhY2s6Ly9jcnlzdGFsbGl6ZS1hcHAvLi9zcmMvc2VydmljZXMvcGF5bWVudC1wcm92aWRlcnMvbW9sbGllL2NyZWF0ZS1wYXltZW50LmpzIiwid2VicGFjazovL2NyeXN0YWxsaXplLWFwcC8uL3NyYy9zZXJ2aWNlcy9wYXltZW50LXByb3ZpZGVycy9tb2xsaWUvaW5kZXguanMiLCJ3ZWJwYWNrOi8vY3J5c3RhbGxpemUtYXBwLy4vc3JjL3NlcnZpY2VzL3BheW1lbnQtcHJvdmlkZXJzL21vbGxpZS90by1jcnlzdGFsbGl6ZS1vcmRlci1tb2RlbC5qcyIsIndlYnBhY2s6Ly9jcnlzdGFsbGl6ZS1hcHAvLi9zcmMvc2VydmljZXMvcGF5bWVudC1wcm92aWRlcnMvbW9sbGllL3V0aWxzLmpzIiwid2VicGFjazovL2NyeXN0YWxsaXplLWFwcC8uL3NyYy9zZXJ2aWNlcy9wYXltZW50LXByb3ZpZGVycy9zdHJpcGUvY29uZmlybS1vcmRlci5qcyIsIndlYnBhY2s6Ly9jcnlzdGFsbGl6ZS1hcHAvLi9zcmMvc2VydmljZXMvcGF5bWVudC1wcm92aWRlcnMvc3RyaXBlL2NyZWF0ZS1wYXltZW50LWludGVudC5qcyIsIndlYnBhY2s6Ly9jcnlzdGFsbGl6ZS1hcHAvLi9zcmMvc2VydmljZXMvcGF5bWVudC1wcm92aWRlcnMvc3RyaXBlL2luZGV4LmpzIiwid2VicGFjazovL2NyeXN0YWxsaXplLWFwcC8uL3NyYy9zZXJ2aWNlcy9wYXltZW50LXByb3ZpZGVycy9zdHJpcGUvdG8tY3J5c3RhbGxpemUtb3JkZXItbW9kZWwuanMiLCJ3ZWJwYWNrOi8vY3J5c3RhbGxpemUtYXBwLy4vc3JjL3NlcnZpY2VzL3BheW1lbnQtcHJvdmlkZXJzL3N0cmlwZS91dGlscy5qcyIsIndlYnBhY2s6Ly9jcnlzdGFsbGl6ZS1hcHAvLi9zcmMvc2VydmljZXMvcGF5bWVudC1wcm92aWRlcnMvdmlwcHMvZmFsbGJhY2suanMiLCJ3ZWJwYWNrOi8vY3J5c3RhbGxpemUtYXBwLy4vc3JjL3NlcnZpY2VzL3BheW1lbnQtcHJvdmlkZXJzL3ZpcHBzL2luZGV4LmpzIiwid2VicGFjazovL2NyeXN0YWxsaXplLWFwcC8uL3NyYy9zZXJ2aWNlcy9wYXltZW50LXByb3ZpZGVycy92aXBwcy9pbml0aWF0ZS1wYXltZW50LmpzIiwid2VicGFjazovL2NyeXN0YWxsaXplLWFwcC8uL3NyYy9zZXJ2aWNlcy9wYXltZW50LXByb3ZpZGVycy92aXBwcy9vcmRlci11cGRhdGUuanMiLCJ3ZWJwYWNrOi8vY3J5c3RhbGxpemUtYXBwLy4vc3JjL3NlcnZpY2VzL3BheW1lbnQtcHJvdmlkZXJzL3ZpcHBzL3VzZXItY29uc2VudC1yZW1vdmFsLmpzIiwid2VicGFjazovL2NyeXN0YWxsaXplLWFwcC8uL3NyYy9zZXJ2aWNlcy9wYXltZW50LXByb3ZpZGVycy92aXBwcy91dGlscy5qcyIsIndlYnBhY2s6Ly9jcnlzdGFsbGl6ZS1hcHAvLi9zcmMvc2VydmljZXMvdXNlci1zZXJ2aWNlL2luZGV4LmpzIiwid2VicGFjazovL2NyeXN0YWxsaXplLWFwcC8uL3NyYy9zZXJ2aWNlcy92b3VjaGVyLXNlcnZpY2UvY3J5c3RhbGxpemUtdm91Y2hlcnMtZXhhbXBsZS5qcyIsIndlYnBhY2s6Ly9jcnlzdGFsbGl6ZS1hcHAvLi9zcmMvc2VydmljZXMvdm91Y2hlci1zZXJ2aWNlL2luZGV4LmpzIiwid2VicGFjazovL2NyeXN0YWxsaXplLWFwcC9leHRlcm5hbCBcIkBjcnlzdGFsbGl6ZS9ub2RlLWtsYXJuYVwiIiwid2VicGFjazovL2NyeXN0YWxsaXplLWFwcC9leHRlcm5hbCBcIkBjcnlzdGFsbGl6ZS9ub2RlLXZpcHBzXCIiLCJ3ZWJwYWNrOi8vY3J5c3RhbGxpemUtYXBwL2V4dGVybmFsIFwiQG1vbGxpZS9hcGktY2xpZW50XCIiLCJ3ZWJwYWNrOi8vY3J5c3RhbGxpemUtYXBwL2V4dGVybmFsIFwiQHNlbmRncmlkL21haWxcIiIsIndlYnBhY2s6Ly9jcnlzdGFsbGl6ZS1hcHAvZXh0ZXJuYWwgXCJhcG9sbG8tc2VydmVyLW1pY3JvXCIiLCJ3ZWJwYWNrOi8vY3J5c3RhbGxpemUtYXBwL2V4dGVybmFsIFwiZ3JhcGhxbC10YWdcIiIsIndlYnBhY2s6Ly9jcnlzdGFsbGl6ZS1hcHAvZXh0ZXJuYWwgXCJpbnZhcmlhbnRcIiIsIndlYnBhY2s6Ly9jcnlzdGFsbGl6ZS1hcHAvZXh0ZXJuYWwgXCJqc29ud2VidG9rZW5cIiIsIndlYnBhY2s6Ly9jcnlzdGFsbGl6ZS1hcHAvZXh0ZXJuYWwgXCJtam1sXCIiLCJ3ZWJwYWNrOi8vY3J5c3RhbGxpemUtYXBwL2V4dGVybmFsIFwibm9kZS1mZXRjaFwiIiwid2VicGFjazovL2NyeXN0YWxsaXplLWFwcC9leHRlcm5hbCBcInN0cmlwZVwiIl0sIm5hbWVzIjpbImFsbG93Q29ycyIsImZuIiwicmVxIiwicmVzIiwic2V0SGVhZGVyIiwiaGVhZGVycyIsIm9yaWdpbiIsIm1ldGhvZCIsInN0YXR1cyIsImVuZCIsImFwb2xsb1NlcnZlciIsIkFwb2xsb1NlcnZlciIsImNyZWF0ZUdyYXBoUUxTZXJ2ZXJDb25maWciLCJhcGlQYXRoUHJlZml4Iiwibm9ybWFsaXNlUmVxdWVzdCIsInJlZnJlc2hVc2VyVG9rZW4iLCJuZXdVc2VyVG9rZW4iLCJ1c2VyU2VydmljZSIsImNvbmZpZyIsImFwaSIsImJvZHlQYXJzZXIiLCJjb3JzIiwiY3JlYXRlSGFuZGxlciIsInBhdGgiLCJyZXF1aXJlIiwiZ2V0SG9zdCIsIm1vZHVsZSIsImV4cG9ydHMiLCJjcmVhdGVDb250ZXh0IiwiY29udGV4dCIsImFyZ3MiLCJjb29raWVzIiwidXNlciIsImF1dGhlbnRpY2F0ZSIsIkNPT0tJRV9VU0VSX1RPS0VOX05BTUUiLCJ2YWxpZGF0ZVJlZnJlc2hUb2tlbiIsInJlZnJlc2hUb2tlbiIsIkNPT0tJRV9SRUZSRVNIX1RPS0VOX05BTUUiLCJlbWFpbCIsInB1YmxpY0hvc3QiLCJzZXJ2aWNlQ2FsbGJhY2tIb3N0IiwicHJvY2VzcyIsImVudiIsIlNFUlZJQ0VfQ0FMTEJBQ0tfSE9TVCIsImVuZHNXaXRoIiwicmVzb2x2ZXJzIiwidHlwZURlZnMiLCJjcmVhdGVHcmFwaHFsU2VydmVyQ29uZmlnIiwiaW50cm9zcGVjdGlvbiIsInBsYXlncm91bmQiLCJlbmRwb2ludCIsInNldHRpbmdzIiwic3Vic2NyaXB0aW9ucyIsImNyeXN0YWxsaXplIiwiYmFza2V0U2VydmljZSIsInZvdWNoZXJTZXJ2aWNlIiwic3RyaXBlU2VydmljZSIsIm1vbGxpZVNlcnZpY2UiLCJ2aXBwc1NlcnZpY2UiLCJrbGFybmFTZXJ2aWNlIiwicGF5bWVudFByb3ZpZGVyUmVzb2x2ZXIiLCJzZXJ2aWNlIiwiZW5hYmxlZCIsImZyb250ZW5kQ29uZmlnIiwiUXVlcnkiLCJteUN1c3RvbUJ1c2luZXNzVGhpbmciLCJ3aGF0SXNUaGlzIiwiYmFza2V0IiwicGFyZW50IiwiZ2V0IiwiZ2V0VXNlciIsIm9yZGVycyIsInBheW1lbnRQcm92aWRlcnMiLCJ2b3VjaGVyIiwiTXlDdXN0b21CdXNpbm5lc3NRdWVyaWVzIiwiZHluYW1pY1JhbmRvbUludCIsImNvbnNvbGUiLCJsb2ciLCJwYXJzZUludCIsIk1hdGgiLCJyYW5kb20iLCJQYXltZW50UHJvdmlkZXJzUXVlcmllcyIsInN0cmlwZSIsImtsYXJuYSIsInZpcHBzIiwibW9sbGllIiwiT3JkZXJRdWVyaWVzIiwiaWQiLCJNdXRhdGlvbiIsIlVzZXJNdXRhdGlvbnMiLCJzZW5kTWFnaWNMaW5rIiwidXBkYXRlIiwiUGF5bWVudFByb3ZpZGVyc011dGF0aW9ucyIsIlN0cmlwZU11dGF0aW9ucyIsImNyZWF0ZVBheW1lbnRJbnRlbnQiLCJjb25maXJtT3JkZXIiLCJLbGFybmFNdXRhdGlvbnMiLCJyZW5kZXJDaGVja291dCIsIk1vbGxpZU11dGF0aW9ucyIsImNyZWF0ZVBheW1lbnQiLCJWaXBwc011dGF0aW9ucyIsImluaXRpYXRlUGF5bWVudCIsImdxbCIsImZvcm1hdEN1cnJlbmN5IiwiYW1vdW50IiwiY3VycmVuY3kiLCJJbnRsIiwiTnVtYmVyRm9ybWF0Iiwic3R5bGUiLCJmb3JtYXQiLCJ4cHJvdG9jb2wiLCJ4aG9zdCIsIkhPU1RfVVJMIiwiSG9zdCIsImhvc3QiLCJzdGFydHNXaXRoIiwiVkVSQ0VMX1VSTCIsIkVycm9yIiwidHJ1bmNhdGVEZWNpbWFsc09mTnVtYmVyIiwib3JpZ2luYWxOdW1iZXIiLCJudW1iZXJPZkRlY2ltYWxzIiwiYW1vdW50VHJ1bmNhdGVkIiwidG9GaXhlZCIsInBhcnNlRmxvYXQiLCJjYWxjdWxhdGVWb3VjaGVyRGlzY291bnRBbW91bnQiLCJpc0Rpc2NvdW50QW1vdW50IiwiQm9vbGVhbiIsImRpc2NvdW50QW1vdW50IiwiYW1vdW50VG9EaXNjb3VudCIsImRpc2NvdW50UGVyY2VudCIsImdldFByb2R1Y3RzRnJvbUNyeXN0YWxsaXplIiwicGF0aHMiLCJsYW5ndWFnZSIsImxlbmd0aCIsImNhbGxDYXRhbG9ndWVBcGkiLCJyZXNwb25zZSIsInF1ZXJ5IiwibWFwIiwiaW5kZXgiLCJfIiwiaSIsImRhdGEiLCJmaWx0ZXIiLCJwIiwiZ2V0VG90YWxzIiwiY2FydCIsInZhdFR5cGUiLCJyZWR1Y2UiLCJhY2MiLCJjdXJyIiwicXVhbnRpdHkiLCJwcmljZSIsInByaWNlVG9Vc2UiLCJkaXNjb3VudGVkIiwiZ3Jvc3MiLCJuZXQiLCJ0YXgiLCJkaXNjb3VudCIsImJhc2tldE1vZGVsIiwibG9jYWxlIiwidm91Y2hlckNvZGUiLCJiYXNrZXRGcm9tQ2xpZW50IiwiY29kZSIsImlzVmFsaWQiLCJwcm9kdWN0RGF0YUZyb21DcnlzdGFsbGl6ZSIsImNyeXN0YWxsaXplQ2F0YWxvZ3VlTGFuZ3VhZ2UiLCJpdGVtRnJvbUNsaWVudCIsInByb2R1Y3QiLCJmaW5kIiwidmFyaWFudHMiLCJzb21lIiwidiIsInNrdSIsInZhcmlhbnQiLCJwcmljZVZhcmlhbnRzIiwicHYiLCJpZGVudGlmaWVyIiwicHJpY2VWYXJpYW50SWRlbnRpZmllciIsInBlcmNlbnQiLCJwcm9kdWN0SWQiLCJwcm9kdWN0VmFyaWFudElkIiwidG90YWwiLCJjYXJ0V2l0aFZvdWNoZXIiLCJjYXJ0SXRlbSIsInBvcnRpb25PZlRvdGFsIiwicG9ydGlvbk9mRGlzY291bnQiLCJjYWxsUGltQXBpIiwiZ2V0VGVuYW50SWQiLCJjcmVhdGVDdXN0b21lciIsImN1c3RvbWVyIiwidGVuYW50SWQiLCJ2YXJpYWJsZXMiLCJpbnB1dCIsImNyZWF0ZSIsImdldEN1c3RvbWVyIiwiZXh0ZXJuYWxSZWZlcmVuY2UiLCJ1cGRhdGVDdXN0b21lciIsInJlc3QiLCJjdXN0b21lcnMiLCJjYWxsT3JkZXJzQXBpIiwibm9ybWFsaXNlT3JkZXJNb2RlbCIsImNyZWF0ZU9yZGVyIiwiZ2V0T3JkZXIiLCJvcmRlciIsIndhaXRGb3JPcmRlclRvQmVQZXJzaXN0YXRlZCIsInVwZGF0ZU9yZGVyIiwicmV0cmllcyIsIm1heFJldHJpZXMiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsImNoZWNrIiwic2V0VGltZW91dCIsImludmFyaWFudCIsImZldGNoIiwiQ1JZU1RBTExJWkVfVEVOQU5UX0lERU5USUZJRVIiLCJDUllTVEFMTElaRV9BQ0NFU1NfVE9LRU5fSUQiLCJDUllTVEFMTElaRV9BQ0NFU1NfVE9LRU5fU0VDUkVUIiwiY3JlYXRlQXBpQ2FsbGVyIiwidXJpIiwiY2FsbEFwaSIsIm9wZXJhdGlvbk5hbWUiLCJib2R5IiwiSlNPTiIsInN0cmluZ2lmeSIsImpzb24iLCJlcnJvcnMiLCJoYW5kbGVPcmRlckNhcnRJdGVtIiwiaXRlbSIsImltYWdlcyIsIm5hbWUiLCJpbWFnZVVybCIsInVybCIsImZpcnN0TmFtZSIsImxhc3ROYW1lIiwiYWRkcmVzc2VzIiwidHlwZSIsInVuZGVmaW5lZCIsInRlbmFudElkUmVzcG9uc2UiLCJ0ZW5hbnQiLCJjYWxsU2VhcmNoQXBpIiwic2VuZEVtYWlsIiwic2VuZE9yZGVyQ29uZmlybWF0aW9uIiwic2VuZFVzZXJNYWdpY0xpbmsiLCJvcmRlcklkIiwibWptbDJodG1sIiwic3VjY2VzcyIsImVycm9yIiwiaHRtbCIsInRvIiwic3ViamVjdCIsInNlbmRNYWdpY0xpbmtMb2dpbiIsImxvZ2luTGluayIsIlNFTkRHUklEX0FQSV9LRVkiLCJFTUFJTF9GUk9NIiwic2dNYWlsIiwic2V0QXBpS2V5Iiwic2VuZCIsImZyb20iLCJrbGFybmFDYXB0dXJlIiwiY3J5c3RhbGxpemVPcmRlcklkIiwiZ2V0Q2xpZW50IiwiY3J5c3RhbGxpemVPcmRlciIsImtsYXJuYVBheW1lbnQiLCJwYXltZW50IiwicHJvdmlkZXIiLCJrbGFybmFPcmRlcklkIiwia2xhcm5hQ2xpZW50Iiwib3JkZXJtYW5hZ2VtZW50VjEiLCJjYXB0dXJlcyIsImNhcHR1cmUiLCJLTEFSTkFfVVNFUk5BTUUiLCJLTEFSTkFfUEFTU1dPUkQiLCJwdXNoIiwia2xhcm5hUHVzaCIsImFja25vd2xlZGdlIiwiY2hlY2tvdXRNb2RlbCIsInRvS2xhcm5hT3JkZXJNb2RlbCIsImNvbmZpcm1hdGlvblVSTCIsInRlcm1zVVJMIiwiY2hlY2tvdXRVUkwiLCJjdXN0b21lcldpdGhDdXJyZW50TG9nZ2VkSW5Vc2VyIiwiY29uZmlybWF0aW9uIiwiVVJMIiwicmVwbGFjZSIsInNlYXJjaFBhcmFtcyIsImFwcGVuZCIsInZhbGlkS2xhcm5hT3JkZXJNb2RlbCIsInB1cmNoYXNlX2NvdW50cnkiLCJwdXJjaGFzZV9jdXJyZW5jeSIsIm1lcmNoYW50X3VybHMiLCJ0ZXJtcyIsImNoZWNrb3V0IiwidG9TdHJpbmciLCJjaGVja291dFYzIiwiaHRtbF9zbmlwcGV0Iiwib3JkZXJfaWQiLCJjcnlzdGFsbGl6ZVRvS2xhcm5hT3JkZXJNb2RlbCIsIm9yZGVyX2Ftb3VudCIsIm9yZGVyX3RheF9hbW91bnQiLCJvcmRlcl9saW5lcyIsInVuaXRfcHJpY2UiLCJyZWZlcmVuY2UiLCJ0b3RhbF9hbW91bnQiLCJ0b3RhbF90YXhfYW1vdW50IiwidGF4X3JhdGUiLCJpbWFnZV91cmwiLCJtZXJjaGFudF9kYXRhIiwidGF4R3JvdXAiLCJjbGllbnQiLCJLbGFybmEiLCJ1c2VybmFtZSIsInBhc3N3b3JkIiwiYXBpRW5kcG9pbnQiLCJjcmVhdGVNb2xsaWVQYXltZW50IiwiaXNTdWJzY3JpcHRpb24iLCJtZXRhIiwia2V5IiwidmFsdWUiLCJtb2xsaWVDbGllbnQiLCJtb2xsaWVDdXN0b21lciIsInRyaW0iLCJ2YWxpZE1vbGxpZU9yZGVyIiwiTU9MTElFX0RFRkFVTFRfQ1VSUkVOQ1kiLCJ0b1VwcGVyQ2FzZSIsImN1c3RvbWVySWQiLCJzZXF1ZW5jZVR5cGUiLCJkZXNjcmlwdGlvbiIsInJlZGlyZWN0VXJsIiwid2ViaG9va1VybCIsIm1ldGFkYXRhIiwibW9sbGllT3JkZXJSZXNwb25zZSIsInBheW1lbnRzIiwiY3VzdG9tZXJzX21hbmRhdGVzIiwibWFuZGF0ZUlkIiwic3RhcnREYXRlIiwiRGF0ZSIsInNldERhdGUiLCJnZXREYXRlIiwidG9JU09TdHJpbmciLCJzcGxpdCIsImN1c3RvbWVyc19zdWJzY3JpcHRpb25zIiwidGltZXMiLCJpbnRlcnZhbCIsImNoZWNrb3V0TGluayIsIl9saW5rcyIsImhyZWYiLCJ0b0NyeXN0YWxsaXplT3JkZXJNb2RlbCIsIk1PTExJRV9BUElfS0VZIiwibW9sbGllVG9DcnlzdGFsbGl6ZU9yZGVyTW9kZWwiLCJtb2xsaWVPcmRlciIsImN1c3RvbWVyTmFtZSIsIm1pZGRsZU5hbWUiLCJzbGljZSIsImpvaW4iLCJiaXJ0aERhdGUiLCJzdHJlZXQiLCJzdHJlZXQyIiwicG9zdGFsQ29kZSIsImNpdHkiLCJzdGF0ZSIsImNvdW50cnkiLCJwaG9uZSIsImN1c3RvbSIsInByb3BlcnRpZXMiLCJwcm9wZXJ0eSIsInJlc291cmNlIiwibW9kZSIsInByb2ZpbGVJZCIsImNyZWF0ZU1vbGxpZUNsaWVudCIsImFwaUtleSIsInBheW1lbnRJbnRlbnRJZCIsImNyeXN0YWxsaXplT3JkZXJNb2RlbCIsImN1c3RvbWVySWRlbnRpZmllciIsImNvbmZpcm0iLCJwYXltZW50TWV0aG9kSWQiLCJwYXltZW50SW50ZW50IiwicGF5bWVudEludGVudHMiLCJwYXltZW50X21ldGhvZCIsIlNUUklQRV9TRUNSRVRfS0VZIiwiU1RSSVBFX1BVQkxJU0hBQkxFX0tFWSIsInB1Ymxpc2hhYmxlS2V5Iiwic3RyaXBlVG9DcnlzdGFsbGl6ZU9yZGVyTW9kZWwiLCJyZXRyaWV2ZSIsImNoYXJnZXMiLCJjaGFyZ2UiLCJiaWxsaW5nX2RldGFpbHMiLCJyZWNlaXB0X2VtYWlsIiwiYWRkcmVzc1dpdGhFbWFpbCIsImEiLCJhZGRyZXNzIiwibGluZTEiLCJsaW5lMiIsInBvc3RhbF9jb2RlIiwicGF5bWVudF9pbnRlbnQiLCJwYXltZW50TWV0aG9kIiwicGF5bWVudF9tZXRob2RfZGV0YWlscyIsInN1YnNjcmlwdGlvbklkIiwic3Vic2NyaXB0aW9uIiwic3RyaXBlU2RrIiwidmlwcHNGYWxsYmFjayIsIm9uU3VjY2Vzc1VSTCIsIm9uRXJyb3JVUkwiLCJyZWRpcmVjdFRvIiwidmlwcHNDbGllbnQiLCJnZXRPcmRlckRldGFpbHMiLCJsYXN0VHJhbnNhY3Rpb25Mb2dFbnRyeSIsInRyYW5zYWN0aW9uTG9nSGlzdG9yeSIsInNvcnQiLCJiIiwidGltZVN0YW1wIiwib3BlcmF0aW9uIiwib3BlcmF0aW9uU3VjY2VzcyIsInVzZXJEZXRhaWxzIiwidXNlcklkIiwibW9iaWxlTnVtYmVyIiwic2hpcHBpbmdEZXRhaWxzIiwiYWRkcmVzc0xpbmUxIiwiYWRkcmVzc0xpbmUyIiwicG9zdENvZGUiLCJWSVBQU19DTElFTlRfSUQiLCJWSVBQU19DTElFTlRfU0VDUkVUIiwiVklQUFNfTUVSQ0hBTlRfU0VSSUFMIiwiVklQUFNfU1VCX0tFWSIsImZhbGxiYWNrIiwib3JkZXJVcGRhdGUiLCJ1c2VyQ29uc2VudFJlbW92YWwiLCJpbml0aWF0ZVZpcHBzUGF5bWVudCIsImZhbGxCYWNrVVJMIiwiZW5jb2RlVVJJQ29tcG9uZW50IiwidmlwcHNSZXNwb25zZSIsIm1lcmNoYW50SW5mbyIsIm1lcmNoYW50U2VyaWFsTnVtYmVyIiwiZmFsbEJhY2siLCJjYWxsYmFja1ByZWZpeCIsInNoaXBwaW5nRGV0YWlsc1ByZWZpeCIsImNvbnNlbnRSZW1vdmFsUHJlZml4IiwicGF5bWVudFR5cGUiLCJpc0FwcCIsInN0YXRpY1NoaXBwaW5nRGV0YWlscyIsImlzRGVmYXVsdCIsInByaW9yaXR5Iiwic2hpcHBpbmdDb3N0Iiwic2hpcHBpbmdNZXRob2QiLCJzaGlwcGluZ01ldGhvZElkIiwiY3VzdG9tZXJJbmZvIiwidHJhbnNhY3Rpb24iLCJ0cmFuc2FjdGlvblRleHQiLCJ2aXBwc09yZGVyVXBkYXRlIiwidmlwcHNVc2VyQ29uc2VudFJlbW92YWwiLCJ2aXBwc1VzZXJJZCIsIlZpcHBzQ2xpZW50IiwidGVzdERyaXZlIiwic2VjcmV0IiwiSldUX1NFQ1JFVCIsIkNPT0tJRV9VU0VSX1RPS0VOX01BWF9BR0UiLCJDT09LSUVfUkVGUkVTSF9UT0tFTl9NQVhfQUdFIiwidXNlckluQ29udGV4dCIsImlzTG9nZ2VkSW4iLCJsb2dvdXRMaW5rIiwiY3J5c3RhbGxpemVDdXN0b21lciIsIk9iamVjdCIsImFzc2lnbiIsInRva2VuIiwiand0IiwiZGVjb2RlZCIsInZlcmlmeSIsInJlZGlyZWN0VVJMQWZ0ZXJMb2dpbiIsImVtYWlsUGFydHMiLCJzaWduIiwiZXhwaXJlc0luIiwiZW1haWxTZXJ2aWNlIiwidmFsaWRhdGVNYWdpY0xpbmtUb2tlbiIsInNpZ25lZExvZ2luVG9rZW4iLCJzaWduZWRMb2dpblJlZnJlc2hUb2tlbiIsImUiLCJnZXRDcnlzdGFsbGl6ZVZvdWNoZXJzIiwidm91Y2hlcnNGcm9tQ3J5c3RhbGxpemUiLCJjYXRhbG9ndWUiLCJjaGlsZHJlbiIsInZvdWNoZXJGcm9tQ3J5c3RhbGxpemUiLCJkaXNjb3VudENvbXBvbmVudCIsImNvbnRlbnQiLCJzZWxlY3RlZENvbXBvbmVudCIsIm51bWJlciIsInRleHQiLCJvbmx5Rm9yQXV0aG9yaXNlZFVzZXIiLCJ2b3VjaGVyUmVnaXN0ZXIiLCJpc0Fub255bW91c1VzZXIiLCJhbGxDcnlzdGFsbGl6ZVZvdWNoZXJzIiwiYWxsVm91Y2hlcnMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQUEsTUFBTUEsU0FBUyxHQUFJQyxFQUFELElBQVEsT0FBT0MsR0FBUCxFQUFZQyxHQUFaLEtBQW9CO0FBQzVDQSxLQUFHLENBQUNDLFNBQUosQ0FBYyxrQ0FBZCxFQUFrRCxJQUFsRDtBQUNBRCxLQUFHLENBQUNDLFNBQUosQ0FBYyw2QkFBZCxFQUE2Q0YsR0FBRyxDQUFDRyxPQUFKLENBQVlDLE1BQVosSUFBc0IsR0FBbkU7QUFDQUgsS0FBRyxDQUFDQyxTQUFKLENBQ0UsOEJBREYsRUFFRSxtQ0FGRjtBQUlBRCxLQUFHLENBQUNDLFNBQUosQ0FDRSw4QkFERixFQUVFLHdIQUZGOztBQUlBLE1BQUlGLEdBQUcsQ0FBQ0ssTUFBSixLQUFlLFNBQW5CLEVBQThCO0FBQzVCSixPQUFHLENBQUNLLE1BQUosQ0FBVyxHQUFYLEVBQWdCQyxHQUFoQjtBQUNBO0FBQ0Q7O0FBQ0QsU0FBTyxNQUFNUixFQUFF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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FyUUEsQzs7Ozs7Ozs7OztBQ0ZBLFNBQVNDLGNBQVQsQ0FBd0I7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QUFDLEdBQUdILGVBQUosRUFBcUIsR0FBR0Usc0JBQXhCLENBQXBCLENBUDJCLENBUzNCO0FBQ0E7O0FBQ0EsUUFBSUQsZUFBSixFQUFxQjtBQUNuQixZQUFNL1osT0FBTyxHQUFHaWEsV0FBVyxDQUN4QjVWLE1BRGEsQ0FDTDZCLENBQUQsSUFBTyxDQUFDQSxDQUFDLENBQUMyVCxxQkFESixFQUViOVQsSUFGYSxDQUVQRyxDQUFELElBQU9BLENBQUMsQ0FBQ1QsSUFBRixLQUFXQSxJQUZWLENBQWhCO0FBSUEsYUFBTztBQUNMQyxlQUFPLEVBQUVyQyxPQUFPLENBQUNyRCxPQUFELENBRFg7QUFFTEE7QUFGSyxPQUFQO0FBSUQsS0FwQjBCLENBc0IzQjs7O0FBQ0EsUUFBSUEsT0FBTyxHQUFHaWEsV0FBVyxDQUFDbFUsSUFBWixDQUFrQkcsQ0FBRCxJQUFPQSxDQUFDLENBQUNULElBQUYsS0FBV0EsSUFBbkMsQ0FBZDtBQUVBLFdBQU87QUFDTEMsYUFBTyxFQUFFckMsT0FBTyxDQUFDckQsT0FBRCxDQURYO0FBRUxBO0FBRkssS0FBUDtBQUlEOztBQTlCYyxDQUFqQixDOzs7Ozs7Ozs7OztBQ2xDQSxzRDs7Ozs7Ozs7Ozs7QUNBQSxxRDs7Ozs7Ozs7Ozs7QUNBQSxnRDs7Ozs7Ozs7Ozs7QUNBQSw0Qzs7Ozs7Ozs7Ozs7QUNBQSxpRDs7Ozs7Ozs7Ozs7QUNBQSx5Qzs7Ozs7Ozs7Ozs7QUNBQSx1Qzs7Ozs7Ozs7Ozs7QUNBQSwwQzs7Ozs7Ozs7Ozs7QUNBQSxrQzs7Ozs7Ozs7Ozs7QUNBQSx3Qzs7Ozs7Ozs7Ozs7QUNBQSxvQyIsImZpbGUiOiJwYWdlcy9hcGkvZ3JhcGhxbC5qcyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IGFsbG93Q29ycyA9IChmbikgPT4gYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIHJlcy5zZXRIZWFkZXIoXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1DcmVkZW50aWFsc1wiLCB0cnVlKTtcbiAgcmVzLnNldEhlYWRlcihcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiLCByZXEuaGVhZGVycy5vcmlnaW4gfHwgJyonKTtcbiAgcmVzLnNldEhlYWRlcihcbiAgICBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU1ldGhvZHNcIixcbiAgICBcIkdFVCxPUFRJT05TLFBBVENILERFTEVURSxQT1NULFBVVFwiXG4gICk7XG4gIHJlcy5zZXRIZWFkZXIoXG4gICAgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzXCIsXG4gICAgXCJYLUNTUkYtVG9rZW4sIFgtUmVxdWVzdGVkLVdpdGgsIEFjY2VwdCwgQWNjZXB0LVZlcnNpb24sIENvbnRlbnQtTGVuZ3RoLCBDb250ZW50LU1ENSwgQ29udGVudC1UeXBlLCBEYXRlLCBYLUFwaS1WZXJzaW9uXCJcbiAgKTtcbiAgaWYgKHJlcS5tZXRob2QgPT09IFwiT1BUSU9OU1wiKSB7XG4gICAgcmVzLnN0YXR1cygyMDApLmVuZCgpO1xuICAgIHJldHVybjtcbiAgfVxuICByZXR1cm4gYXdhaXQgZm4ocmVxLCByZXMpO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgYWxsb3dDb3JzO1xuIiwiaW1wb3J0IHsgQXBvbGxvU2VydmVyIH0gZnJvbSBcImFwb2xsby1zZXJ2ZXItbWljcm9cIjtcblxuaW1wb3J0IGNvcnMgZnJvbSBcIi4uLy4uL2xpYi9jb3JzXCI7XG5cbmltcG9ydCBjcmVhdGVHcmFwaFFMU2VydmVyQ29uZmlnIGZyb20gXCIuLi8uLi9zcmMvZ3JhcGhxbC1zZXJ2ZXJcIjtcbmltcG9ydCB1c2VyU2VydmljZSBmcm9tIFwiLi4vLi4vc3JjL3NlcnZpY2VzL3VzZXItc2VydmljZVwiO1xuXG5jb25zdCBhcG9sbG9TZXJ2ZXIgPSBuZXcgQXBvbGxvU2VydmVyKFxuICBjcmVhdGVHcmFwaFFMU2VydmVyQ29uZmlnKHtcbiAgICBhcGlQYXRoUHJlZml4OiBcIi9hcGlcIixcbiAgICBub3JtYWxpc2VSZXF1ZXN0KHsgcmVxIH0pIHtcbiAgICAgIHJldHVybiByZXE7XG4gICAgfSxcbiAgICByZWZyZXNoVXNlclRva2VuKHsgcmVzIH0sIG5ld1VzZXJUb2tlbikge1xuICAgICAgcmVzLnNldEhlYWRlcihcbiAgICAgICAgXCJTZXQtQ29va2llXCIsXG4gICAgICAgIGAke3VzZXJTZXJ2aWNlLkNPT0tJRV9VU0VSX1RPS0VOX05BTUV9PSR7bmV3VXNlclRva2VufTsgSHR0cE9ubHk7IE1heC1BZ2U9JHt1c2VyU2VydmljZS5DT09LSUVfVVNFUl9UT0tFTl9NQVhfQUdFfTsgUGF0aD0vYFxuICAgICAgKTtcbiAgICB9LFxuICB9KVxuKTtcblxuZXhwb3J0IGNvbnN0IGNvbmZpZyA9IHtcbiAgYXBpOiB7XG4gICAgYm9keVBhcnNlcjogZmFsc2UsXG4gIH0sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBjb3JzKGFwb2xsb1NlcnZlci5jcmVhdGVIYW5kbGVyKHsgcGF0aDogXCIvYXBpL2dyYXBocWxcIiB9KSk7XG4iLCJjb25zdCB1c2VyU2VydmljZSA9IHJlcXVpcmUoXCIuLi9zZXJ2aWNlcy91c2VyLXNlcnZpY2VcIik7XG5jb25zdCBnZXRIb3N0ID0gcmVxdWlyZShcIi4uL2xpYi9nZXQtaG9zdFwiKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjcmVhdGVDb250ZXh0KHtcbiAgYXBpUGF0aFByZWZpeCxcbiAgbm9ybWFsaXNlUmVxdWVzdCxcbiAgcmVmcmVzaFVzZXJUb2tlbixcbn0pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGNvbnRleHQoYXJncykge1xuICAgIGNvbnN0IHsgY29va2llcywgaGVhZGVycyB9ID0gbm9ybWFsaXNlUmVxdWVzdChhcmdzKTtcblxuICAgIGNvbnN0IHVzZXIgPSB1c2VyU2VydmljZS5hdXRoZW50aWNhdGUoXG4gICAgICBjb29raWVzW3VzZXJTZXJ2aWNlLkNPT0tJRV9VU0VSX1RPS0VOX05BTUVdXG4gICAgKTtcblxuICAgIC8vIFJlZnJlc2ggdGhlIHVzZXIgdG9rZW4gKGlmIGF2YWlsYWJsZSlcbiAgICBpZiAodXNlciAmJiByZWZyZXNoVXNlclRva2VuKSB7XG4gICAgICBjb25zdCBuZXdVc2VyVG9rZW4gPSB1c2VyU2VydmljZS52YWxpZGF0ZVJlZnJlc2hUb2tlbih7XG4gICAgICAgIHJlZnJlc2hUb2tlbjogY29va2llc1t1c2VyU2VydmljZS5DT09LSUVfUkVGUkVTSF9UT0tFTl9OQU1FXSxcbiAgICAgICAgZW1haWw6IHVzZXIuZW1haWwsXG4gICAgICB9KTtcbiAgICAgIGlmIChuZXdVc2VyVG9rZW4pIHtcbiAgICAgICAgcmVmcmVzaFVzZXJUb2tlbihhcmdzLCBuZXdVc2VyVG9rZW4pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIERldGVybWluZSB0aGUgVVJMIGZvciB3ZWJob29rIGNhbGxiYWNrcyAoZXg6IGh0dHBzOi8vc2VydmljZS1hcGkuZXhhbXBsZS5jb20vYXBpKVxuICAgIGNvbnN0IHB1YmxpY0hvc3QgPSBnZXRIb3N0KHsgaGVhZGVycyB9KSArIGFwaVBhdGhQcmVmaXg7XG5cbiAgICAvKipcbiAgICAgKiBzZXJ2aWNlQ2FsbGJhY2tIb3N0IGlzIHVzZWQgZm9yIHRoaXJkIHBhcnR5IHNlcnZpY2VzIGNhbGxiYWNrc1xuICAgICAqIEl0IHdpbGwgYmUgdXNlZCBpbiBlLmcuIHBheW1lbnQgcHJvdmlkZXIgc2VydmljZXMgY2FsbGJhY2tzXG4gICAgICogd2hlbiBhc3luYyBvcGVyYXRpb25zIGFyZSBmaW5pc2hlZFxuICAgICAqXG4gICAgICogRXhhbXBsZSBmb3IgbG9jYWwgZGV2ZWxvcG1lbnQ6XG4gICAgICogIC0gcHVibGljSG9zdDogaHR0cDovL2xvY2FsaG9zdDozMDAxL2FwaVxuICAgICAqICAtIHNlcnZpY2VDYWxsYmFja0hvc3Q6IGh0dHBzOi8vYWJjZGVmZ2gxMjM0NS5uZ3Jvay5pby9hcGlcbiAgICAgKlxuICAgICAqIEV4YW1wbGUgZm9yIHByb2QgZGV2ZWxvcG1lbnQ6XG4gICAgICogIC0gcHVibGljSG9zdDogaHR0cHM6Ly9teS1zZXJ2aWNlLWFwaS5zaG9wLmNvbS9hcGlcbiAgICAgKiAgLSBzZXJ2aWNlQ2FsbGJhY2tIb3N0OiBodHRwczovL215LXNlcnZpY2UtYXBpLnNob3AuY29tL2FwaVxuICAgICAqL1xuICAgIGxldCBzZXJ2aWNlQ2FsbGJhY2tIb3N0ID0gcHJvY2Vzcy5lbnYuU0VSVklDRV9DQUxMQkFDS19IT1NUO1xuICAgIGlmIChzZXJ2aWNlQ2FsbGJhY2tIb3N0KSB7XG4gICAgICBpZiAoIXNlcnZpY2VDYWxsYmFja0hvc3QuZW5kc1dpdGgoYXBpUGF0aFByZWZpeCkpIHtcbiAgICAgICAgc2VydmljZUNhbGxiYWNrSG9zdCArPSBhcGlQYXRoUHJlZml4O1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzZXJ2aWNlQ2FsbGJhY2tIb3N0ID0gcHVibGljSG9zdDtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgdXNlcixcbiAgICAgIHB1YmxpY0hvc3QsXG4gICAgICBzZXJ2aWNlQ2FsbGJhY2tIb3N0LFxuICAgIH07XG4gIH07XG59O1xuIiwiY29uc3QgY3JlYXRlQ29udGV4dCA9IHJlcXVpcmUoXCIuL2NyZWF0ZS1jb250ZXh0XCIpO1xuY29uc3QgcmVzb2x2ZXJzID0gcmVxdWlyZShcIi4vcmVzb2x2ZXJzXCIpO1xuY29uc3QgdHlwZURlZnMgPSByZXF1aXJlKFwiLi90eXBlLWRlZnNcIik7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY3JlYXRlR3JhcGhxbFNlcnZlckNvbmZpZyh7XG4gIGFwaVBhdGhQcmVmaXggPSBcIlwiLFxuICByZWZyZXNoVXNlclRva2VuLFxuICBub3JtYWxpc2VSZXF1ZXN0LFxufSkge1xuICBjb25zdCBjb250ZXh0ID0gY3JlYXRlQ29udGV4dCh7XG4gICAgYXBpUGF0aFByZWZpeCxcbiAgICByZWZyZXNoVXNlclRva2VuLFxuICAgIG5vcm1hbGlzZVJlcXVlc3QsXG4gIH0pO1xuXG4gIHJldHVybiB7XG4gICAgY29udGV4dCxcbiAgICByZXNvbHZlcnMsXG4gICAgdHlwZURlZnMsXG4gICAgaW50cm9zcGVjdGlvbjogdHJ1ZSxcbiAgICBwbGF5Z3JvdW5kOiB7XG4gICAgICBlbmRwb2ludDogY29udGV4dC5wdWJsaWNIb3N0LFxuICAgICAgc2V0dGluZ3M6IHtcbiAgICAgICAgXCJyZXF1ZXN0LmNyZWRlbnRpYWxzXCI6IFwiaW5jbHVkZVwiLFxuICAgICAgfSxcbiAgICB9LFxuICAgIC8vIERpc2FibGUgc3Vic2NyaXB0aW9ucyAobm90IGN1cnJlbnRseSBzdXBwb3J0ZWQgd2l0aCBBcG9sbG9HYXRld2F5KVxuICAgIHN1YnNjcmlwdGlvbnM6IGZhbHNlLFxuICB9O1xufTtcbiIsImNvbnN0IGNyeXN0YWxsaXplID0gcmVxdWlyZShcIi4uL3NlcnZpY2VzL2NyeXN0YWxsaXplXCIpO1xuXG5jb25zdCBiYXNrZXRTZXJ2aWNlID0gcmVxdWlyZShcIi4uL3NlcnZpY2VzL2Jhc2tldC1zZXJ2aWNlXCIpO1xuY29uc3QgdXNlclNlcnZpY2UgPSByZXF1aXJlKFwiLi4vc2VydmljZXMvdXNlci1zZXJ2aWNlXCIpO1xuY29uc3Qgdm91Y2hlclNlcnZpY2UgPSByZXF1aXJlKFwiLi4vc2VydmljZXMvdm91Y2hlci1zZXJ2aWNlXCIpO1xuXG5jb25zdCBzdHJpcGVTZXJ2aWNlID0gcmVxdWlyZShcIi4uL3NlcnZpY2VzL3BheW1lbnQtcHJvdmlkZXJzL3N0cmlwZVwiKTtcbmNvbnN0IG1vbGxpZVNlcnZpY2UgPSByZXF1aXJlKFwiLi4vc2VydmljZXMvcGF5bWVudC1wcm92aWRlcnMvbW9sbGllXCIpO1xuY29uc3QgdmlwcHNTZXJ2aWNlID0gcmVxdWlyZShcIi4uL3NlcnZpY2VzL3BheW1lbnQtcHJvdmlkZXJzL3ZpcHBzXCIpO1xuY29uc3Qga2xhcm5hU2VydmljZSA9IHJlcXVpcmUoXCIuLi9zZXJ2aWNlcy9wYXltZW50LXByb3ZpZGVycy9rbGFybmFcIik7XG5cbmZ1bmN0aW9uIHBheW1lbnRQcm92aWRlclJlc29sdmVyKHNlcnZpY2UpIHtcbiAgcmV0dXJuICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgZW5hYmxlZDogc2VydmljZS5lbmFibGVkLFxuICAgICAgY29uZmlnOiBzZXJ2aWNlLmZyb250ZW5kQ29uZmlnLFxuICAgIH07XG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBRdWVyeToge1xuICAgIG15Q3VzdG9tQnVzaW5lc3NUaGluZzogKCkgPT4gKHtcbiAgICAgIHdoYXRJc1RoaXM6XG4gICAgICAgIFwiVGhpcyBpcyBhbiBleGFtcGxlIG9mIGEgY3VzdG9tIHF1ZXJ5IGZvciBHcmFwaFFMIGRlbW9uc3RyYXRpb24gcHVycHVzZXMuIENoZWNrIG91dCB0aGUgTXlDdXN0b21CdXNpbm5lc3NRdWVyaWVzIHJlc29sdmVycyBmb3IgaG93IHRvIHJlc29sdmUgYWRkaXRpb25hbCBmaWVsZHMgYXBhcnQgZnJvbSB0aGUgJ3doYXRJc1RoaXMnIGZpZWxkXCIsXG4gICAgfSksXG4gICAgYmFza2V0OiAocGFyZW50LCBhcmdzLCBjb250ZXh0KSA9PiBiYXNrZXRTZXJ2aWNlLmdldCh7IC4uLmFyZ3MsIGNvbnRleHQgfSksXG4gICAgdXNlcjogKHBhcmVudCwgYXJncywgY29udGV4dCkgPT4gdXNlclNlcnZpY2UuZ2V0VXNlcih7IGNvbnRleHQgfSksXG4gICAgb3JkZXJzOiAoKSA9PiAoe30pLFxuICAgIHBheW1lbnRQcm92aWRlcnM6ICgpID0+ICh7fSksXG4gICAgdm91Y2hlcjogKHBhcmVudCwgYXJncywgY29udGV4dCkgPT5cbiAgICAgIHZvdWNoZXJTZXJ2aWNlLmdldCh7IC4uLmFyZ3MsIGNvbnRleHQgfSksXG4gIH0sXG4gIE15Q3VzdG9tQnVzaW5uZXNzUXVlcmllczoge1xuICAgIGR5bmFtaWNSYW5kb21JbnQoKSB7XG4gICAgICBjb25zb2xlLmxvZyhcImR5bmFtaWNSYW5kb21JbnQgY2FsbGVkXCIpO1xuICAgICAgcmV0dXJuIHBhcnNlSW50KE1hdGgucmFuZG9tKCkgKiAxMDApO1xuICAgIH0sXG4gIH0sXG4gIFBheW1lbnRQcm92aWRlcnNRdWVyaWVzOiB7XG4gICAgc3RyaXBlOiBwYXltZW50UHJvdmlkZXJSZXNvbHZlcihzdHJpcGVTZXJ2aWNlKSxcbiAgICBrbGFybmE6IHBheW1lbnRQcm92aWRlclJlc29sdmVyKGtsYXJuYVNlcnZpY2UpLFxuICAgIHZpcHBzOiBwYXltZW50UHJvdmlkZXJSZXNvbHZlcih2aXBwc1NlcnZpY2UpLFxuICAgIG1vbGxpZTogcGF5bWVudFByb3ZpZGVyUmVzb2x2ZXIobW9sbGllU2VydmljZSksXG4gIH0sXG4gIE9yZGVyUXVlcmllczoge1xuICAgIGdldDogKHBhcmVudCwgYXJncykgPT4gY3J5c3RhbGxpemUub3JkZXJzLmdldChhcmdzLmlkKSxcbiAgfSxcbiAgTXV0YXRpb246IHtcbiAgICB1c2VyOiAoKSA9PiAoe30pLFxuICAgIHBheW1lbnRQcm92aWRlcnM6ICgpID0+ICh7fSksXG4gIH0sXG4gIFVzZXJNdXRhdGlvbnM6IHtcbiAgICBzZW5kTWFnaWNMaW5rOiAocGFyZW50LCBhcmdzLCBjb250ZXh0KSA9PlxuICAgICAgdXNlclNlcnZpY2Uuc2VuZE1hZ2ljTGluayh7IC4uLmFyZ3MsIGNvbnRleHQgfSksXG4gICAgdXBkYXRlOiAocGFyZW50LCBhcmdzLCBjb250ZXh0KSA9PiB1c2VyU2VydmljZS51cGRhdGUoeyAuLi5hcmdzLCBjb250ZXh0IH0pLFxuICB9LFxuICBQYXltZW50UHJvdmlkZXJzTXV0YXRpb25zOiB7XG4gICAgc3RyaXBlOiAoKSA9PiAoe30pLFxuICAgIGtsYXJuYTogKCkgPT4gKHt9KSxcbiAgICBtb2xsaWU6ICgpID0+ICh7fSksXG4gICAgdmlwcHM6ICgpID0+ICh7fSksXG4gIH0sXG4gIFN0cmlwZU11dGF0aW9uczoge1xuICAgIGNyZWF0ZVBheW1lbnRJbnRlbnQ6IChwYXJlbnQsIGFyZ3MsIGNvbnRleHQpID0+XG4gICAgICBzdHJpcGVTZXJ2aWNlLmNyZWF0ZVBheW1lbnRJbnRlbnQoeyAuLi5hcmdzLCBjb250ZXh0IH0pLFxuICAgIGNvbmZpcm1PcmRlcjogKHBhcmVudCwgYXJncywgY29udGV4dCkgPT5cbiAgICAgIHN0cmlwZVNlcnZpY2UuY29uZmlybU9yZGVyKHsgLi4uYXJncywgY29udGV4dCB9KSxcbiAgfSxcbiAgS2xhcm5hTXV0YXRpb25zOiB7XG4gICAgcmVuZGVyQ2hlY2tvdXQ6IChwYXJlbnQsIGFyZ3MsIGNvbnRleHQpID0+XG4gICAgICBrbGFybmFTZXJ2aWNlLnJlbmRlckNoZWNrb3V0KHtcbiAgICAgICAgLi4uYXJncyxcbiAgICAgICAgY29udGV4dCxcbiAgICAgIH0pLFxuICB9LFxuICBNb2xsaWVNdXRhdGlvbnM6IHtcbiAgICBjcmVhdGVQYXltZW50OiAocGFyZW50LCBhcmdzLCBjb250ZXh0KSA9PlxuICAgICAgbW9sbGllU2VydmljZS5jcmVhdGVQYXltZW50KHtcbiAgICAgICAgLi4uYXJncyxcbiAgICAgICAgY29udGV4dCxcbiAgICAgIH0pLFxuICB9LFxuICBWaXBwc011dGF0aW9uczoge1xuICAgIGluaXRpYXRlUGF5bWVudDogKHBhcmVudCwgYXJncywgY29udGV4dCkgPT5cbiAgICAgIHZpcHBzU2VydmljZS5pbml0aWF0ZVBheW1lbnQoe1xuICAgICAgICAuLi5hcmdzLFxuICAgICAgICBjb250ZXh0LFxuICAgICAgfSksXG4gIH0sXG59O1xuIiwiY29uc3QgZ3FsID0gcmVxdWlyZShcImdyYXBocWwtdGFnXCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGdxbGBcbiAgc2NhbGFyIEpTT05cblxuICB0eXBlIFF1ZXJ5IHtcbiAgICBteUN1c3RvbUJ1c2luZXNzVGhpbmc6IE15Q3VzdG9tQnVzaW5uZXNzUXVlcmllcyFcbiAgICBiYXNrZXQoYmFza2V0TW9kZWw6IEJhc2tldE1vZGVsSW5wdXQhKTogQmFza2V0IVxuICAgIHVzZXI6IFVzZXIhXG4gICAgcGF5bWVudFByb3ZpZGVyczogUGF5bWVudFByb3ZpZGVyc1F1ZXJpZXMhXG4gICAgb3JkZXJzOiBPcmRlclF1ZXJpZXMhXG4gICAgdm91Y2hlcihjb2RlOiBTdHJpbmchKTogVm91Y2hlclJlc3BvbnNlIVxuICB9XG5cbiAgdHlwZSBWb3VjaGVyUmVzcG9uc2Uge1xuICAgIHZvdWNoZXI6IFZvdWNoZXJcbiAgICBpc1ZhbGlkOiBCb29sZWFuIVxuICB9XG5cbiAgdHlwZSBNeUN1c3RvbUJ1c2lubmVzc1F1ZXJpZXMge1xuICAgIHdoYXRJc1RoaXM6IFN0cmluZyFcbiAgICBkeW5hbWljUmFuZG9tSW50OiBJbnQhXG4gIH1cblxuICB0eXBlIEJhc2tldCB7XG4gICAgY2FydDogW0NhcnRJdGVtIV0hXG4gICAgdG90YWw6IFByaWNlIVxuICAgIHZvdWNoZXI6IFZvdWNoZXJcbiAgfVxuXG4gIHR5cGUgQ2FydEl0ZW0ge1xuICAgIHNrdTogU3RyaW5nIVxuICAgIG5hbWU6IFN0cmluZ1xuICAgIHBhdGg6IFN0cmluZ1xuICAgIHF1YW50aXR5OiBJbnQhXG4gICAgdmF0VHlwZTogVmF0VHlwZVxuICAgIHN0b2NrOiBJbnRcbiAgICBwcmljZTogUHJpY2VcbiAgICBwcmljZVZhcmlhbnRzOiBbUHJpY2VWYXJpYW50IV1cbiAgICBhdHRyaWJ1dGVzOiBbQXR0cmlidXRlIV1cbiAgICBpbWFnZXM6IFtJbWFnZSFdXG4gIH1cblxuICB0eXBlIFByaWNlVmFyaWFudCB7XG4gICAgcHJpY2U6IEZsb2F0XG4gICAgaWRlbnRpZmllcjogU3RyaW5nIVxuICAgIGN1cnJlbmN5OiBTdHJpbmchXG4gIH1cblxuICB0eXBlIEF0dHJpYnV0ZSB7XG4gICAgYXR0cmlidXRlOiBTdHJpbmchXG4gICAgdmFsdWU6IFN0cmluZ1xuICB9XG5cbiAgdHlwZSBJbWFnZSB7XG4gICAgdXJsOiBTdHJpbmchXG4gICAgdmFyaWFudHM6IFtJbWFnZVZhcmlhbnQhXVxuICB9XG5cbiAgdHlwZSBJbWFnZVZhcmlhbnQge1xuICAgIHVybDogU3RyaW5nIVxuICAgIHdpZHRoOiBJbnRcbiAgICBoZWlnaHQ6IEludFxuICB9XG5cbiAgdHlwZSBQcmljZSB7XG4gICAgZ3Jvc3M6IEZsb2F0IVxuICAgIG5ldDogRmxvYXQhXG4gICAgY3VycmVuY3k6IFN0cmluZ1xuICAgIHRheDogVGF4XG4gICAgdGF4QW1vdW50OiBGbG9hdFxuICAgIGRpc2NvdW50OiBGbG9hdCFcbiAgfVxuXG4gIHR5cGUgVGF4IHtcbiAgICBuYW1lOiBTdHJpbmdcbiAgICBwZXJjZW50OiBGbG9hdFxuICB9XG5cbiAgdHlwZSBWYXRUeXBlIHtcbiAgICBuYW1lOiBTdHJpbmchXG4gICAgcGVyY2VudDogSW50IVxuICB9XG5cbiAgdHlwZSBVc2VyIHtcbiAgICBsb2dvdXRMaW5rOiBTdHJpbmchXG4gICAgaXNMb2dnZWRJbjogQm9vbGVhbiFcbiAgICBlbWFpbDogU3RyaW5nXG4gICAgZmlyc3ROYW1lOiBTdHJpbmdcbiAgICBtaWRkbGVOYW1lOiBTdHJpbmdcbiAgICBsYXN0TmFtZTogU3RyaW5nXG4gICAgbWV0YTogW0tleVZhbHVlUGFpciFdXG4gIH1cblxuICB0eXBlIFBheW1lbnRQcm92aWRlcnNRdWVyaWVzIHtcbiAgICBzdHJpcGU6IFBheW1lbnRQcm92aWRlciFcbiAgICBrbGFybmE6IFBheW1lbnRQcm92aWRlciFcbiAgICB2aXBwczogUGF5bWVudFByb3ZpZGVyIVxuICAgIG1vbGxpZTogUGF5bWVudFByb3ZpZGVyIVxuICB9XG5cbiAgdHlwZSBQYXltZW50UHJvdmlkZXIge1xuICAgIGVuYWJsZWQ6IEJvb2xlYW4hXG4gICAgY29uZmlnOiBKU09OXG4gIH1cblxuICB0eXBlIE9yZGVyUXVlcmllcyB7XG4gICAgZ2V0KGlkOiBTdHJpbmchKTogSlNPTlxuICB9XG5cbiAgdHlwZSBWb3VjaGVyIHtcbiAgICBjb2RlOiBTdHJpbmchXG4gICAgZGlzY291bnRBbW91bnQ6IEludFxuICAgIGRpc2NvdW50UGVyY2VudDogRmxvYXRcbiAgfVxuXG4gIHR5cGUgTXV0YXRpb24ge1xuICAgIHVzZXI6IFVzZXJNdXRhdGlvbnNcbiAgICBwYXltZW50UHJvdmlkZXJzOiBQYXltZW50UHJvdmlkZXJzTXV0YXRpb25zIVxuICB9XG5cbiAgaW5wdXQgQmFza2V0TW9kZWxJbnB1dCB7XG4gICAgbG9jYWxlOiBMb2NhbGVJbnB1dCFcbiAgICBjYXJ0OiBbU2ltcGxlQ2FydEl0ZW0hXSFcbiAgICB2b3VjaGVyQ29kZTogU3RyaW5nXG4gICAgY3J5c3RhbGxpemVPcmRlcklkOiBTdHJpbmdcbiAgICBrbGFybmFPcmRlcklkOiBTdHJpbmdcbiAgfVxuXG4gIGlucHV0IExvY2FsZUlucHV0IHtcbiAgICBsb2NhbGU6IFN0cmluZyFcbiAgICBkaXNwbGF5TmFtZTogU3RyaW5nXG4gICAgYXBwTGFuZ3VhZ2U6IFN0cmluZyFcbiAgICBjcnlzdGFsbGl6ZUNhdGFsb2d1ZUxhbmd1YWdlOiBTdHJpbmdcbiAgICBjcnlzdGFsbGl6ZVByaWNlVmFyaWFudDogU3RyaW5nXG4gIH1cblxuICBpbnB1dCBTaW1wbGVDYXJ0SXRlbSB7XG4gICAgc2t1OiBTdHJpbmchXG4gICAgcGF0aDogU3RyaW5nIVxuICAgIHF1YW50aXR5OiBJbnRcbiAgICBwcmljZVZhcmlhbnRJZGVudGlmaWVyOiBTdHJpbmchXG4gIH1cblxuICB0eXBlIFVzZXJNdXRhdGlvbnMge1xuICAgIHNlbmRNYWdpY0xpbmsoXG4gICAgICBlbWFpbDogU3RyaW5nIVxuICAgICAgcmVkaXJlY3RVUkxBZnRlckxvZ2luOiBTdHJpbmchXG4gICAgKTogU2VuZE1hZ2ljTGlua1Jlc3BvbnNlIVxuICAgIHVwZGF0ZShpbnB1dDogVXNlclVwZGF0ZUlucHV0ISk6IFVzZXIhXG4gIH1cblxuICBpbnB1dCBVc2VyVXBkYXRlSW5wdXQge1xuICAgIGZpcnN0TmFtZTogU3RyaW5nXG4gICAgbWlkZGxlTmFtZTogU3RyaW5nXG4gICAgbGFzdE5hbWU6IFN0cmluZ1xuICAgIG1ldGE6IFtLZXlWYWx1ZVBhaXJJbnB1dCFdXG4gIH1cblxuICB0eXBlIFNlbmRNYWdpY0xpbmtSZXNwb25zZSB7XG4gICAgc3VjY2VzczogQm9vbGVhbiFcbiAgICBlcnJvcjogU3RyaW5nXG4gIH1cblxuICBpbnB1dCBDaGVja291dE1vZGVsSW5wdXQge1xuICAgIGJhc2tldE1vZGVsOiBCYXNrZXRNb2RlbElucHV0IVxuICAgIGN1c3RvbWVyOiBPcmRlckN1c3RvbWVySW5wdXRcbiAgICBjb25maXJtYXRpb25VUkw6IFN0cmluZyFcbiAgICBjaGVja291dFVSTDogU3RyaW5nIVxuICAgIHRlcm1zVVJMOiBTdHJpbmchXG4gIH1cblxuICBpbnB1dCBPcmRlckN1c3RvbWVySW5wdXQge1xuICAgIGZpcnN0TmFtZTogU3RyaW5nXG4gICAgbGFzdE5hbWU6IFN0cmluZ1xuICAgIGFkZHJlc3NlczogW0FkZHJlc3NJbnB1dCFdXG4gIH1cblxuICBpbnB1dCBBZGRyZXNzSW5wdXQge1xuICAgIHR5cGU6IFN0cmluZ1xuICAgIGVtYWlsOiBTdHJpbmdcbiAgICBmaXJzdE5hbWU6IFN0cmluZ1xuICAgIG1pZGRsZU5hbWU6IFN0cmluZ1xuICAgIGxhc3ROYW1lOiBTdHJpbmdcbiAgICBzdHJlZXQ6IFN0cmluZ1xuICAgIHN0cmVldDI6IFN0cmluZ1xuICAgIHN0cmVldE51bWJlcjogU3RyaW5nXG4gICAgcG9zdGFsQ29kZTogU3RyaW5nXG4gICAgY2l0eTogU3RyaW5nXG4gICAgc3RhdGU6IFN0cmluZ1xuICAgIGNvdW50cnk6IFN0cmluZ1xuICAgIHBob25lOiBTdHJpbmdcbiAgfVxuXG4gIHR5cGUgUGF5bWVudFByb3ZpZGVyc011dGF0aW9ucyB7XG4gICAgc3RyaXBlOiBTdHJpcGVNdXRhdGlvbnMhXG4gICAga2xhcm5hOiBLbGFybmFNdXRhdGlvbnMhXG4gICAgbW9sbGllOiBNb2xsaWVNdXRhdGlvbnMhXG4gICAgdmlwcHM6IFZpcHBzTXV0YXRpb25zIVxuICB9XG5cbiAgdHlwZSBTdHJpcGVNdXRhdGlvbnMge1xuICAgIGNyZWF0ZVBheW1lbnRJbnRlbnQoXG4gICAgICBjaGVja291dE1vZGVsOiBDaGVja291dE1vZGVsSW5wdXQhXG4gICAgICBjb25maXJtOiBCb29sZWFuXG4gICAgICBwYXltZW50TWV0aG9kSWQ6IFN0cmluZ1xuICAgICk6IEpTT05cbiAgICBjb25maXJtT3JkZXIoXG4gICAgICBjaGVja291dE1vZGVsOiBDaGVja291dE1vZGVsSW5wdXQhXG4gICAgICBwYXltZW50SW50ZW50SWQ6IFN0cmluZyFcbiAgICApOiBTdHJpcGVDb25maXJtT3JkZXJSZXNwb25zZSFcbiAgfVxuXG4gIHR5cGUgU3RyaXBlQ29uZmlybU9yZGVyUmVzcG9uc2Uge1xuICAgIHN1Y2Nlc3M6IEJvb2xlYW4hXG4gICAgb3JkZXJJZDogU3RyaW5nXG4gIH1cblxuICB0eXBlIEtsYXJuYU11dGF0aW9ucyB7XG4gICAgcmVuZGVyQ2hlY2tvdXQoXG4gICAgICBjaGVja291dE1vZGVsOiBDaGVja291dE1vZGVsSW5wdXQhXG4gICAgKTogS2xhcm5hUmVuZGVyQ2hlY2tvdXRSZXBvbnNlIVxuICB9XG5cbiAgdHlwZSBLbGFybmFSZW5kZXJDaGVja291dFJlcG9uc2Uge1xuICAgIGh0bWw6IFN0cmluZyFcbiAgICBrbGFybmFPcmRlcklkOiBTdHJpbmchXG4gICAgY3J5c3RhbGxpemVPcmRlcklkOiBTdHJpbmchXG4gIH1cblxuICB0eXBlIE1vbGxpZU11dGF0aW9ucyB7XG4gICAgY3JlYXRlUGF5bWVudChcbiAgICAgIGNoZWNrb3V0TW9kZWw6IENoZWNrb3V0TW9kZWxJbnB1dCFcbiAgICApOiBNb2xsaWVDcmVhdGVQYXltZW50UmVzcG9uc2UhXG4gIH1cblxuICB0eXBlIE1vbGxpZUNyZWF0ZVBheW1lbnRSZXNwb25zZSB7XG4gICAgc3VjY2VzczogQm9vbGVhbiFcbiAgICBjaGVja291dExpbms6IFN0cmluZ1xuICAgIGNyeXN0YWxsaXplT3JkZXJJZDogU3RyaW5nIVxuICB9XG5cbiAgdHlwZSBWaXBwc011dGF0aW9ucyB7XG4gICAgaW5pdGlhdGVQYXltZW50KFxuICAgICAgY2hlY2tvdXRNb2RlbDogQ2hlY2tvdXRNb2RlbElucHV0IVxuICAgICk6IFZpcHBzSW5pdGlhdGVQYXltZW50UmVzcG9uc2UhXG4gIH1cblxuICB0eXBlIFZpcHBzSW5pdGlhdGVQYXltZW50UmVzcG9uc2Uge1xuICAgIHN1Y2Nlc3M6IEJvb2xlYW4hXG4gICAgY2hlY2tvdXRMaW5rOiBTdHJpbmdcbiAgICBjcnlzdGFsbGl6ZU9yZGVySWQ6IFN0cmluZyFcbiAgfVxuXG4gIHR5cGUgS2V5VmFsdWVQYWlyIHtcbiAgICBrZXk6IFN0cmluZyFcbiAgICB2YWx1ZTogU3RyaW5nXG4gIH1cblxuICBpbnB1dCBLZXlWYWx1ZVBhaXJJbnB1dCB7XG4gICAga2V5OiBTdHJpbmchXG4gICAgdmFsdWU6IFN0cmluZ1xuICB9XG5gO1xuIiwiZnVuY3Rpb24gZm9ybWF0Q3VycmVuY3koeyBhbW91bnQsIGN1cnJlbmN5IH0pIHtcbiAgcmV0dXJuIG5ldyBJbnRsLk51bWJlckZvcm1hdChcImVuLVVTXCIsIHsgc3R5bGU6IFwiY3VycmVuY3lcIiwgY3VycmVuY3kgfSkuZm9ybWF0KFxuICAgIGFtb3VudFxuICApO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZm9ybWF0Q3VycmVuY3ksXG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBnZXRIb3N0KHsgaGVhZGVycyB9KSB7XG4gIC8vIElmIGJlaGluZCBhIHJldmVyc2UgcHJveHkgbGlrZSBBV1MgRWxhc3RpYyBCZWFuc3RhbGsgZm9yIGluc3RhbmNlXG4gIGNvbnN0IHsgXCJ4LWZvcndhcmRlZC1wcm90b1wiOiB4cHJvdG9jb2wsIFwieC1mb3J3YXJkZWQtaG9zdFwiOiB4aG9zdCB9ID0gaGVhZGVycztcbiAgaWYgKHhwcm90b2NvbCAmJiB4aG9zdCkge1xuICAgIHJldHVybiBgJHt4cHJvdG9jb2x9Oi8vJHt4aG9zdH1gO1xuICB9XG5cbiAgaWYgKHByb2Nlc3MuZW52LkhPU1RfVVJMKSB7XG4gICAgcmV0dXJuIHByb2Nlc3MuZW52LkhPU1RfVVJMO1xuICB9XG5cbiAgY29uc3QgeyBIb3N0LCBob3N0ID0gSG9zdCB9ID0gaGVhZGVycztcbiAgaWYgKGhvc3QgJiYgaG9zdC5zdGFydHNXaXRoKFwibG9jYWxob3N0XCIpKSB7XG4gICAgcmV0dXJuIGBodHRwOi8vJHtob3N0fWA7XG4gIH1cblxuICAvLyBJZiBob3N0ZWQgb24gVmVyY2VsXG4gIGlmIChwcm9jZXNzLmVudi5WRVJDRUxfVVJMKSB7XG4gICAgcmV0dXJuIGBodHRwczovLyR7cHJvY2Vzcy5lbnYuVkVSQ0VMX1VSTH1gO1xuICB9XG5cbiAgaWYgKCFob3N0KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGRldGVybWluZSBob3N0IGZvciB0aGUgY3VycmVudCByZXF1ZXN0IGNvbnRleHRcIik7XG4gIH1cblxuICByZXR1cm4gYGh0dHBzOi8vJHtob3N0fWA7XG59O1xuIiwiZnVuY3Rpb24gdHJ1bmNhdGVEZWNpbWFsc09mTnVtYmVyKG9yaWdpbmFsTnVtYmVyLCBudW1iZXJPZkRlY2ltYWxzID0gMikge1xuICAvLyB0b0ZpeGVkKCkgY29udmVydHMgYSBudW1iZXIgaW50byBhIHN0cmluZyBieSB0cnVuY2F0aW5nIGl0XG4gIC8vIHdpdGggdGhlIG51bWJlciBvZiBkZWNpbWFscyBwYXNzZWQgYXMgcGFyYW1ldGVyLlxuICBjb25zdCBhbW91bnRUcnVuY2F0ZWQgPSBvcmlnaW5hbE51bWJlci50b0ZpeGVkKG51bWJlck9mRGVjaW1hbHMpO1xuICAvLyBXZSB1c2UgcGFyc2VGbG9hdCgpIHRvIHJldHVybiBhIHRyYW5zZm9ybSB0aGUgc3RyaW5nIGludG8gYSBudW1iZXJcbiAgcmV0dXJuIHBhcnNlRmxvYXQoYW1vdW50VHJ1bmNhdGVkKTtcbn1cblxuZnVuY3Rpb24gY2FsY3VsYXRlVm91Y2hlckRpc2NvdW50QW1vdW50KHsgdm91Y2hlciwgYW1vdW50IH0pIHtcbiAgLy8gV2UgYXNzdW1lIHRoYXQgdGhlIHZvdWNoZXIgaGFzIHRoZSByaWdodCBmb3JtYXQuXG4gIC8vIEl0IGVpdGhlciBoYXMgYGRpc2NvdW50UGVyY2VudGAgb3IgYGRpc2NvdW50QW1vdW50YFxuICBjb25zdCBpc0Rpc2NvdW50QW1vdW50ID0gQm9vbGVhbih2b3VjaGVyLmRpc2NvdW50QW1vdW50KTtcblxuICBpZiAoaXNEaXNjb3VudEFtb3VudCkge1xuICAgIHJldHVybiB2b3VjaGVyLmRpc2NvdW50QW1vdW50O1xuICB9XG5cbiAgY29uc3QgYW1vdW50VG9EaXNjb3VudCA9IChhbW91bnQgKiB2b3VjaGVyLmRpc2NvdW50UGVyY2VudCkgLyAxMDA7XG5cbiAgcmV0dXJuIHRydW5jYXRlRGVjaW1hbHNPZk51bWJlcihhbW91bnRUb0Rpc2NvdW50KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGNhbGN1bGF0ZVZvdWNoZXJEaXNjb3VudEFtb3VudCxcbn07XG4iLCIvKipcbiAqIEdldHMgaW5mb3JtYXRpb24gZm9yIHByb2R1Y3RzIHdpdGggYSBnaXZlbiBwYXRoLlxuICogR2V0cyBhbGwgb2YgdGhlIHByb2R1Y3RzIHdpdGggYSBzaW5nbGUgcmVxdWVzdFxuICogYnkgY29tcG9zaW5nIHRoZSBxdWVyeSBkeW5hbWljYWxseVxuICovXG5hc3luYyBmdW5jdGlvbiBnZXRQcm9kdWN0c0Zyb21DcnlzdGFsbGl6ZSh7IHBhdGhzLCBsYW5ndWFnZSB9KSB7XG4gIGlmIChwYXRocy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICBjb25zdCB7IGNhbGxDYXRhbG9ndWVBcGkgfSA9IHJlcXVpcmUoXCIuLi9jcnlzdGFsbGl6ZS91dGlsc1wiKTtcblxuICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGNhbGxDYXRhbG9ndWVBcGkoe1xuICAgIHF1ZXJ5OiBge1xuICAgICAgJHtwYXRocy5tYXAoXG4gICAgICAgIChwYXRoLCBpbmRleCkgPT4gYFxuICAgICAgICBwcm9kdWN0JHtpbmRleH06IGNhdGFsb2d1ZShwYXRoOiBcIiR7cGF0aH1cIiwgbGFuZ3VhZ2U6IFwiJHtsYW5ndWFnZX1cIikge1xuICAgICAgICAgIHBhdGhcbiAgICAgICAgICAuLi4gb24gUHJvZHVjdCB7XG4gICAgICAgICAgICBpZFxuICAgICAgICAgICAgdmF0VHlwZSB7XG4gICAgICAgICAgICAgIG5hbWVcbiAgICAgICAgICAgICAgcGVyY2VudFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyaWFudHMge1xuICAgICAgICAgICAgICBpZFxuICAgICAgICAgICAgICBza3VcbiAgICAgICAgICAgICAgbmFtZVxuICAgICAgICAgICAgICBzdG9ja1xuICAgICAgICAgICAgICBwcmljZVZhcmlhbnRzIHtcbiAgICAgICAgICAgICAgICBwcmljZVxuICAgICAgICAgICAgICAgIGlkZW50aWZpZXJcbiAgICAgICAgICAgICAgICBjdXJyZW5jeVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGF0dHJpYnV0ZXMge1xuICAgICAgICAgICAgICAgIGF0dHJpYnV0ZVxuICAgICAgICAgICAgICAgIHZhbHVlXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaW1hZ2VzIHtcbiAgICAgICAgICAgICAgICB1cmxcbiAgICAgICAgICAgICAgICB2YXJpYW50cyB7XG4gICAgICAgICAgICAgICAgICB1cmxcbiAgICAgICAgICAgICAgICAgIHdpZHRoXG4gICAgICAgICAgICAgICAgICBoZWlnaHRcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIGBcbiAgICAgICl9XG4gICAgfWAsXG4gIH0pO1xuXG4gIHJldHVybiBwYXRocy5tYXAoKF8sIGkpID0+IHJlc3BvbnNlLmRhdGFbYHByb2R1Y3Qke2l9YF0pLmZpbHRlcigocCkgPT4gISFwKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGdldFByb2R1Y3RzRnJvbUNyeXN0YWxsaXplLFxufTtcbiIsIi8vIENhbGN1bGF0ZSB0aGUgdG90YWxzXG5mdW5jdGlvbiBnZXRUb3RhbHMoeyBjYXJ0LCB2YXRUeXBlIH0pIHtcbiAgcmV0dXJuIGNhcnQucmVkdWNlKFxuICAgIChhY2MsIGN1cnIpID0+IHtcbiAgICAgIGNvbnN0IHsgcXVhbnRpdHksIHByaWNlIH0gPSBjdXJyO1xuICAgICAgaWYgKHByaWNlKSB7XG4gICAgICAgIGNvbnN0IHByaWNlVG9Vc2UgPSBwcmljZS5kaXNjb3VudGVkIHx8IHByaWNlO1xuICAgICAgICBhY2MuZ3Jvc3MgKz0gcHJpY2VUb1VzZS5ncm9zcyAqIHF1YW50aXR5O1xuICAgICAgICBhY2MubmV0ICs9IHByaWNlVG9Vc2UubmV0ICogcXVhbnRpdHk7XG4gICAgICAgIGFjYy5jdXJyZW5jeSA9IHByaWNlLmN1cnJlbmN5O1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gYWNjO1xuICAgIH0sXG4gICAgeyBncm9zczogMCwgbmV0OiAwLCB0YXg6IHZhdFR5cGUsIGRpc2NvdW50OiAwLCBjdXJyZW5jeTogXCJOL0FcIiB9XG4gICk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBhc3luYyBnZXQoeyBiYXNrZXRNb2RlbCwgY29udGV4dCB9KSB7XG4gICAgY29uc3QgeyBsb2NhbGUsIHZvdWNoZXJDb2RlLCAuLi5iYXNrZXRGcm9tQ2xpZW50IH0gPSBiYXNrZXRNb2RlbDtcblxuICAgIC8qKlxuICAgICAqIFJlc29sdmUgYWxsIHRoZSB2b3VjaGVyIGNvZGVzIHRvIHZhbGlkIHZvdWNoZXJzIGZvciB0aGUgdXNlclxuICAgICAqL1xuICAgIGxldCB2b3VjaGVyO1xuICAgIGlmICh2b3VjaGVyQ29kZSkge1xuICAgICAgY29uc3Qgdm91Y2hlclNlcnZpY2UgPSByZXF1aXJlKFwiLi4vdm91Y2hlci1zZXJ2aWNlXCIpO1xuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB2b3VjaGVyU2VydmljZS5nZXQoeyBjb2RlOiB2b3VjaGVyQ29kZSwgY29udGV4dCB9KTtcblxuICAgICAgaWYgKHJlc3BvbnNlLmlzVmFsaWQpIHtcbiAgICAgICAgdm91Y2hlciA9IHJlc3BvbnNlLnZvdWNoZXI7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IGFsbCBwcm9kdWN0cyBmcm9tIENyeXN0YWxsaXplIGZyb20gdGhlaXIgcGF0aHNcbiAgICAgKi9cbiAgICBjb25zdCB7XG4gICAgICBnZXRQcm9kdWN0c0Zyb21DcnlzdGFsbGl6ZSxcbiAgICB9ID0gcmVxdWlyZShcIi4vZ2V0LXByb2R1Y3RzLWZyb20tY3J5c3RhbGxpemVcIik7XG4gICAgY29uc3QgcHJvZHVjdERhdGFGcm9tQ3J5c3RhbGxpemUgPSBhd2FpdCBnZXRQcm9kdWN0c0Zyb21DcnlzdGFsbGl6ZSh7XG4gICAgICBwYXRoczogYmFza2V0RnJvbUNsaWVudC5jYXJ0Lm1hcCgocCkgPT4gcC5wYXRoKSxcbiAgICAgIGxhbmd1YWdlOiBsb2NhbGUuY3J5c3RhbGxpemVDYXRhbG9ndWVMYW5ndWFnZSxcbiAgICB9KTtcblxuICAgIGxldCB2YXRUeXBlO1xuXG4gICAgLyoqXG4gICAgICogQ29tcG9zZSB0aGUgY29tcGxldGUgY2FydCBpdGVtcyBlbnJpY2hlZCB3aXRoXG4gICAgICogZGF0YSBmcm9tIENyeXN0YWxsaXplXG4gICAgICovXG4gICAgY29uc3QgY2FydCA9IGJhc2tldEZyb21DbGllbnQuY2FydFxuICAgICAgLm1hcCgoaXRlbUZyb21DbGllbnQpID0+IHtcbiAgICAgICAgY29uc3QgcHJvZHVjdCA9IHByb2R1Y3REYXRhRnJvbUNyeXN0YWxsaXplLmZpbmQoKHApID0+XG4gICAgICAgICAgcC52YXJpYW50cy5zb21lKCh2KSA9PiB2LnNrdSA9PT0gaXRlbUZyb21DbGllbnQuc2t1KVxuICAgICAgICApO1xuXG4gICAgICAgIGlmICghcHJvZHVjdCkge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgdmF0VHlwZSA9IHByb2R1Y3QudmF0VHlwZTtcblxuICAgICAgICBjb25zdCB2YXJpYW50ID0gcHJvZHVjdC52YXJpYW50cy5maW5kKFxuICAgICAgICAgICh2KSA9PiB2LnNrdSA9PT0gaXRlbUZyb21DbGllbnQuc2t1XG4gICAgICAgICk7XG4gICAgICAgIGNvbnN0IHsgcHJpY2UsIGN1cnJlbmN5IH0gPVxuICAgICAgICAgIHZhcmlhbnQucHJpY2VWYXJpYW50cy5maW5kKFxuICAgICAgICAgICAgKHB2KSA9PiBwdi5pZGVudGlmaWVyID09PSBpdGVtRnJvbUNsaWVudC5wcmljZVZhcmlhbnRJZGVudGlmaWVyXG4gICAgICAgICAgKSB8fCB2YXJpYW50LnByaWNlVmFyaWFudHMuZmluZCgocCkgPT4gcC5pZGVudGlmaWVyID09PSBcImRlZmF1bHRcIik7XG5cbiAgICAgICAgY29uc3QgZ3Jvc3MgPSBwcmljZTtcbiAgICAgICAgY29uc3QgbmV0ID0gKHByaWNlICogMTAwKSAvICgxMDAgKyB2YXRUeXBlLnBlcmNlbnQpO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgcHJvZHVjdElkOiBwcm9kdWN0LmlkLFxuICAgICAgICAgIHByb2R1Y3RWYXJpYW50SWQ6IHZhcmlhbnQuaWQsXG4gICAgICAgICAgcGF0aDogcHJvZHVjdC5wYXRoLFxuICAgICAgICAgIHF1YW50aXR5OiBpdGVtRnJvbUNsaWVudC5xdWFudGl0eSB8fCAxLFxuICAgICAgICAgIHZhdFR5cGUsXG4gICAgICAgICAgcHJpY2U6IHtcbiAgICAgICAgICAgIGdyb3NzLFxuICAgICAgICAgICAgbmV0LFxuICAgICAgICAgICAgdGF4OiB2YXRUeXBlLFxuICAgICAgICAgICAgY3VycmVuY3ksXG4gICAgICAgICAgfSxcbiAgICAgICAgICAuLi52YXJpYW50LFxuICAgICAgICB9O1xuICAgICAgfSlcbiAgICAgIC5maWx0ZXIoKHApID0+ICEhcCk7XG5cbiAgICAvLyBDYWxjdWxhdGUgdGhlIHRvdGFsc1xuICAgIGxldCB0b3RhbCA9IGdldFRvdGFscyh7IGNhcnQsIHZhdFR5cGUgfSk7XG5cbiAgICAvLyBBZGQgYSB2b3VjaGVyXG4gICAgbGV0IGNhcnRXaXRoVm91Y2hlciA9IGNhcnQ7XG4gICAgaWYgKGNhcnQubGVuZ3RoID4gMCAmJiB2b3VjaGVyKSB7XG4gICAgICBjb25zdCB7XG4gICAgICAgIGNhbGN1bGF0ZVZvdWNoZXJEaXNjb3VudEFtb3VudCxcbiAgICAgIH0gPSByZXF1aXJlKFwiLi9jYWxjdWxhdGUtdm91Y2hlci1kaXNjb3VudC1hbW91bnRcIik7XG4gICAgICBjb25zdCBkaXNjb3VudEFtb3VudCA9IGNhbGN1bGF0ZVZvdWNoZXJEaXNjb3VudEFtb3VudCh7XG4gICAgICAgIHZvdWNoZXIsXG4gICAgICAgIGFtb3VudDogdG90YWwuZ3Jvc3MsXG4gICAgICB9KTtcblxuICAgICAgLy8gUmVkdWNlIHRoZSBwcmljZSBmb3IgZWFjaCBpdGVtXG4gICAgICBjYXJ0V2l0aFZvdWNoZXIgPSBjYXJ0Lm1hcCgoY2FydEl0ZW0pID0+IHtcbiAgICAgICAgY29uc3QgcG9ydGlvbk9mVG90YWwgPVxuICAgICAgICAgIChjYXJ0SXRlbS5wcmljZS5ncm9zcyAqIGNhcnRJdGVtLnF1YW50aXR5KSAvIHRvdGFsLmdyb3NzO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBFYWNoIGNhcnQgaXRlbSBnZXRzIGEgcG9ydGlvbiBvZiB0aGUgdm91Y2hlciB0aGF0XG4gICAgICAgICAqIGlzIHJlbGF0aXZlIHRvIHRoZWlyIG93biBwb3J0aW9uIG9mIHRoZSB0b3RhbCBkaXNjb3VudFxuICAgICAgICAgKi9cbiAgICAgICAgY29uc3QgcG9ydGlvbk9mRGlzY291bnQgPSBkaXNjb3VudEFtb3VudCAqIHBvcnRpb25PZlRvdGFsO1xuXG4gICAgICAgIGNvbnN0IGdyb3NzID1cbiAgICAgICAgICBjYXJ0SXRlbS5wcmljZS5ncm9zcyAtIHBvcnRpb25PZkRpc2NvdW50IC8gY2FydEl0ZW0ucXVhbnRpdHk7XG4gICAgICAgIGNvbnN0IG5ldCA9IChncm9zcyAqIDEwMCkgLyAoMTAwICsgY2FydEl0ZW0udmF0VHlwZS5wZXJjZW50KTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIC4uLmNhcnRJdGVtLFxuICAgICAgICAgIHByaWNlOiB7XG4gICAgICAgICAgICAuLi5jYXJ0SXRlbS5wcmljZSxcbiAgICAgICAgICAgIGdyb3NzLFxuICAgICAgICAgICAgbmV0LFxuICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgICB9KTtcblxuICAgICAgLy8gQWRqdXN0IHRvdGFsc1xuICAgICAgdG90YWwgPSBnZXRUb3RhbHMoeyBjYXJ0OiBjYXJ0V2l0aFZvdWNoZXIsIHZhdFR5cGUgfSk7XG4gICAgICB0b3RhbC5kaXNjb3VudCA9IGRpc2NvdW50QW1vdW50O1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICB2b3VjaGVyLFxuICAgICAgY2FydDogY2FydFdpdGhWb3VjaGVyLFxuICAgICAgdG90YWwsXG4gICAgfTtcbiAgfSxcbn07XG4iLCJjb25zdCB7IGNhbGxQaW1BcGksIGdldFRlbmFudElkIH0gPSByZXF1aXJlKFwiLi4vdXRpbHNcIik7XG5cbm1vZHVsZS5leHBvcnRzID0gYXN5bmMgZnVuY3Rpb24gY3JlYXRlQ3VzdG9tZXIoY3VzdG9tZXIpIHtcbiAgY29uc3QgdGVuYW50SWQgPSBhd2FpdCBnZXRUZW5hbnRJZCgpO1xuICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGNhbGxQaW1BcGkoe1xuICAgIHZhcmlhYmxlczoge1xuICAgICAgaW5wdXQ6IHtcbiAgICAgICAgdGVuYW50SWQsXG4gICAgICAgIC4uLmN1c3RvbWVyLFxuICAgICAgfSxcbiAgICB9LFxuICAgIHF1ZXJ5OiBgXG4gICAgICBtdXRhdGlvbiBjcmVhdGVDdXN0b21lcihcbiAgICAgICAgJGlucHV0OiBDcmVhdGVDdXN0b21lcklucHV0IVxuICAgICAgKSB7XG4gICAgICAgIGN1c3RvbWVyIHtcbiAgICAgICAgICBjcmVhdGUoXG4gICAgICAgICAgICBpbnB1dDogJGlucHV0XG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBpZGVudGlmaWVyXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgYCxcbiAgfSk7XG5cbiAgcmV0dXJuIHJlc3BvbnNlLmRhdGEuY3VzdG9tZXIuY3JlYXRlO1xufTtcbiIsImNvbnN0IHsgY2FsbFBpbUFwaSwgZ2V0VGVuYW50SWQgfSA9IHJlcXVpcmUoXCIuLi91dGlsc1wiKTtcblxubW9kdWxlLmV4cG9ydHMgPSBhc3luYyBmdW5jdGlvbiBnZXRDdXN0b21lcih7IGlkZW50aWZpZXIsIGV4dGVybmFsUmVmZXJlbmNlIH0pIHtcbiAgY29uc3QgdGVuYW50SWQgPSBhd2FpdCBnZXRUZW5hbnRJZCgpO1xuICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGNhbGxQaW1BcGkoe1xuICAgIHZhcmlhYmxlczoge1xuICAgICAgdGVuYW50SWQsXG4gICAgICBpZGVudGlmaWVyLFxuICAgICAgZXh0ZXJuYWxSZWZlcmVuY2UsXG4gICAgfSxcbiAgICBxdWVyeTogYFxuICAgICAgcXVlcnkgZ2V0Q3VzdG9tZXIoXG4gICAgICAgICR0ZW5hbnRJZDogSUQhXG4gICAgICAgICRpZGVudGlmaWVyOiBTdHJpbmdcbiAgICAgICAgJGV4dGVybmFsUmVmZXJlbmNlOiBDdXN0b21lckV4dGVybmFsUmVmZXJlbmNlSW5wdXRcbiAgICAgICl7XG4gICAgICAgIGN1c3RvbWVyIHtcbiAgICAgICAgICBnZXQoXG4gICAgICAgICAgICB0ZW5hbnRJZDogJHRlbmFudElkXG4gICAgICAgICAgICBpZGVudGlmaWVyOiAkaWRlbnRpZmllclxuICAgICAgICAgICAgZXh0ZXJuYWxSZWZlcmVuY2U6ICRleHRlcm5hbFJlZmVyZW5jZVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgaWRlbnRpZmllclxuICAgICAgICAgICAgZmlyc3ROYW1lXG4gICAgICAgICAgICBtaWRkbGVOYW1lXG4gICAgICAgICAgICBsYXN0TmFtZVxuICAgICAgICAgICAgbWV0YSB7XG4gICAgICAgICAgICAgIGtleVxuICAgICAgICAgICAgICB2YWx1ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIGAsXG4gIH0pO1xuXG4gIHJldHVybiByZXNwb25zZS5kYXRhLmN1c3RvbWVyLmdldDtcbn07XG4iLCJjb25zdCBjcmVhdGUgPSByZXF1aXJlKFwiLi9jcmVhdGUtY3VzdG9tZXJcIik7XG5jb25zdCB1cGRhdGUgPSByZXF1aXJlKFwiLi91cGRhdGUtY3VzdG9tZXJcIik7XG5jb25zdCBnZXQgPSByZXF1aXJlKFwiLi9nZXQtY3VzdG9tZXJcIik7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBjcmVhdGUsXG4gIHVwZGF0ZSxcbiAgZ2V0LFxufTtcbiIsImNvbnN0IHsgY2FsbFBpbUFwaSwgZ2V0VGVuYW50SWQgfSA9IHJlcXVpcmUoXCIuLi91dGlsc1wiKTtcblxubW9kdWxlLmV4cG9ydHMgPSBhc3luYyBmdW5jdGlvbiB1cGRhdGVDdXN0b21lcih7IGlkZW50aWZpZXIsIC4uLnJlc3QgfSkge1xuICBjb25zdCB0ZW5hbnRJZCA9IGF3YWl0IGdldFRlbmFudElkKCk7XG4gIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgY2FsbFBpbUFwaSh7XG4gICAgdmFyaWFibGVzOiB7XG4gICAgICB0ZW5hbnRJZCxcbiAgICAgIGlkZW50aWZpZXIsXG4gICAgICAuLi5yZXN0LFxuICAgIH0sXG4gICAgcXVlcnk6IGBcbiAgICAgIG11dGF0aW9uIHVwZGF0ZUN1c3RvbWVyKFxuICAgICAgICAkdGVuYW50SWQ6IElEIVxuICAgICAgICAkaWRlbnRpZmllcjogU3RyaW5nIVxuICAgICAgICAkY3VzdG9tZXI6IFVwZGF0ZUN1c3RvbWVySW5wdXQhXG4gICAgICApIHtcbiAgICAgICAgY3VzdG9tZXIge1xuICAgICAgICAgIHVwZGF0ZShcbiAgICAgICAgICAgIHRlbmFudElkOiAkdGVuYW50SWRcbiAgICAgICAgICAgIGlkZW50aWZpZXI6ICRpZGVudGlmaWVyXG4gICAgICAgICAgICBpbnB1dDogJGN1c3RvbWVyXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBpZGVudGlmaWVyXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgYCxcbiAgfSk7XG5cbiAgcmV0dXJuIHJlc3BvbnNlLmRhdGEuY3VzdG9tZXIudXBkYXRlO1xufTtcbiIsImNvbnN0IG9yZGVycyA9IHJlcXVpcmUoXCIuL29yZGVyc1wiKTtcbmNvbnN0IGN1c3RvbWVycyA9IHJlcXVpcmUoXCIuL2N1c3RvbWVyc1wiKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIG9yZGVycyxcbiAgY3VzdG9tZXJzLFxufTtcbiIsImNvbnN0IHsgY2FsbE9yZGVyc0FwaSwgbm9ybWFsaXNlT3JkZXJNb2RlbCB9ID0gcmVxdWlyZShcIi4uL3V0aWxzXCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGFzeW5jIGZ1bmN0aW9uIGNyZWF0ZU9yZGVyKHZhcmlhYmxlcykge1xuICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGNhbGxPcmRlcnNBcGkoe1xuICAgIHZhcmlhYmxlczogbm9ybWFsaXNlT3JkZXJNb2RlbCh2YXJpYWJsZXMpLFxuICAgIHF1ZXJ5OiBgXG4gICAgICBtdXRhdGlvbiBjcmVhdGVPcmRlcihcbiAgICAgICAgJGN1c3RvbWVyOiBDdXN0b21lcklucHV0IVxuICAgICAgICAkY2FydDogW09yZGVySXRlbUlucHV0IV0hXG4gICAgICAgICR0b3RhbDogUHJpY2VJbnB1dFxuICAgICAgICAkcGF5bWVudDogW1BheW1lbnRJbnB1dCFdXG4gICAgICAgICRhZGRpdGlvbmFsSW5mb3JtYXRpb246IFN0cmluZ1xuICAgICAgICAkbWV0YTogW09yZGVyTWV0YWRhdGFJbnB1dCFdXG4gICAgICApIHtcbiAgICAgICAgb3JkZXJzIHtcbiAgICAgICAgICBjcmVhdGUoXG4gICAgICAgICAgICBpbnB1dDoge1xuICAgICAgICAgICAgICBjdXN0b21lcjogJGN1c3RvbWVyXG4gICAgICAgICAgICAgIGNhcnQ6ICRjYXJ0XG4gICAgICAgICAgICAgIHRvdGFsOiAkdG90YWxcbiAgICAgICAgICAgICAgcGF5bWVudDogJHBheW1lbnRcbiAgICAgICAgICAgICAgYWRkaXRpb25hbEluZm9ybWF0aW9uOiAkYWRkaXRpb25hbEluZm9ybWF0aW9uXG4gICAgICAgICAgICAgIG1ldGE6ICRtZXRhXG4gICAgICAgICAgICB9XG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBpZFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIGAsXG4gIH0pO1xuXG4gIHJldHVybiByZXNwb25zZS5kYXRhLm9yZGVycy5jcmVhdGU7XG59O1xuIiwiY29uc3QgeyBjYWxsT3JkZXJzQXBpIH0gPSByZXF1aXJlKFwiLi4vdXRpbHNcIik7XG5cbm1vZHVsZS5leHBvcnRzID0gYXN5bmMgZnVuY3Rpb24gZ2V0T3JkZXIoaWQpIHtcbiAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBjYWxsT3JkZXJzQXBpKHtcbiAgICB2YXJpYWJsZXM6IHtcbiAgICAgIGlkLFxuICAgIH0sXG4gICAgcXVlcnk6IGBcbiAgICAgIHF1ZXJ5IGdldE9yZGVyKCRpZDogSUQhKXtcbiAgICAgICAgb3JkZXJzIHtcbiAgICAgICAgICBnZXQoaWQ6ICRpZCkge1xuICAgICAgICAgICAgaWRcbiAgICAgICAgICAgIHRvdGFsIHtcbiAgICAgICAgICAgICAgbmV0XG4gICAgICAgICAgICAgIGdyb3NzXG4gICAgICAgICAgICAgIGN1cnJlbmN5XG4gICAgICAgICAgICAgIHRheCB7XG4gICAgICAgICAgICAgICAgbmFtZVxuICAgICAgICAgICAgICAgIHBlcmNlbnRcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbWV0YSB7XG4gICAgICAgICAgICAgIGtleVxuICAgICAgICAgICAgICB2YWx1ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYWRkaXRpb25hbEluZm9ybWF0aW9uXG4gICAgICAgICAgICBwYXltZW50IHtcbiAgICAgICAgICAgICAgLi4uIG9uIFN0cmlwZVBheW1lbnQge1xuICAgICAgICAgICAgICAgIHBheW1lbnRNZXRob2RcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAuLi4gb24gQ3VzdG9tUGF5bWVudCB7XG4gICAgICAgICAgICAgICAgcHJvdmlkZXJcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzIHtcbiAgICAgICAgICAgICAgICAgIHByb3BlcnR5XG4gICAgICAgICAgICAgICAgICB2YWx1ZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FydCB7XG4gICAgICAgICAgICAgIHNrdVxuICAgICAgICAgICAgICBuYW1lXG4gICAgICAgICAgICAgIHF1YW50aXR5XG4gICAgICAgICAgICAgIGltYWdlVXJsXG4gICAgICAgICAgICAgIHByaWNlIHtcbiAgICAgICAgICAgICAgICBuZXRcbiAgICAgICAgICAgICAgICBncm9zc1xuICAgICAgICAgICAgICAgIGN1cnJlbmN5XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgbWV0YSB7XG4gICAgICAgICAgICAgICAga2V5XG4gICAgICAgICAgICAgICAgdmFsdWVcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY3VzdG9tZXIge1xuICAgICAgICAgICAgICBmaXJzdE5hbWVcbiAgICAgICAgICAgICAgbGFzdE5hbWVcbiAgICAgICAgICAgICAgYWRkcmVzc2VzIHtcbiAgICAgICAgICAgICAgICB0eXBlXG4gICAgICAgICAgICAgICAgZW1haWxcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIGAsXG4gIH0pO1xuXG4gIGNvbnN0IG9yZGVyID0gcmVzcG9uc2UuZGF0YS5vcmRlcnMuZ2V0O1xuXG4gIGlmICghb3JkZXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCByZXRyaWV2ZSBvcmRlciBcIiR7aWR9XCJgKTtcbiAgfVxuXG4gIHJldHVybiBvcmRlcjtcbn07XG4iLCJjb25zdCBjcmVhdGUgPSByZXF1aXJlKFwiLi9jcmVhdGUtb3JkZXJcIik7XG5jb25zdCB1cGRhdGUgPSByZXF1aXJlKFwiLi91cGRhdGUtb3JkZXJcIik7XG5jb25zdCBnZXQgPSByZXF1aXJlKFwiLi9nZXQtb3JkZXJcIik7XG5jb25zdCB3YWl0Rm9yT3JkZXJUb0JlUGVyc2lzdGF0ZWQgPSByZXF1aXJlKFwiLi93YWl0LWZvci1vcmRlci10by1iZS1wZXJzaXN0YXRlZFwiKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGNyZWF0ZSxcbiAgdXBkYXRlLFxuICBnZXQsXG4gIHdhaXRGb3JPcmRlclRvQmVQZXJzaXN0YXRlZCxcbn07XG4iLCJjb25zdCB7IGNhbGxQaW1BcGksIG5vcm1hbGlzZU9yZGVyTW9kZWwgfSA9IHJlcXVpcmUoXCIuLi91dGlsc1wiKTtcblxubW9kdWxlLmV4cG9ydHMgPSBhc3luYyBmdW5jdGlvbiB1cGRhdGVPcmRlcihpZCwgdmFyaWFibGVzKSB7XG4gIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgY2FsbFBpbUFwaSh7XG4gICAgdmFyaWFibGVzOiB7XG4gICAgICBpZCxcbiAgICAgIC4uLm5vcm1hbGlzZU9yZGVyTW9kZWwodmFyaWFibGVzKSxcbiAgICB9LFxuICAgIHF1ZXJ5OiBgXG4gICAgICBtdXRhdGlvbiB1cGRhdGVPcmRlcihcbiAgICAgICAgJGlkOiBJRCFcbiAgICAgICAgJGN1c3RvbWVyOiBDdXN0b21lcklucHV0XG4gICAgICAgICRwYXltZW50OiBbUGF5bWVudElucHV0IV1cbiAgICAgICAgJGFkZGl0aW9uYWxJbmZvcm1hdGlvbjogU3RyaW5nXG4gICAgICApIHtcbiAgICAgICAgb3JkZXIge1xuICAgICAgICAgICAgdXBkYXRlKFxuICAgICAgICAgICAgaWQ6ICRpZCxcbiAgICAgICAgICAgIGlucHV0OiB7XG4gICAgICAgICAgICAgIGN1c3RvbWVyOiAkY3VzdG9tZXJcbiAgICAgICAgICAgICAgcGF5bWVudDogJHBheW1lbnRcbiAgICAgICAgICAgICAgYWRkaXRpb25hbEluZm9ybWF0aW9uOiAkYWRkaXRpb25hbEluZm9ybWF0aW9uXG4gICAgICAgICAgICB9XG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBpZFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICBgLFxuICB9KTtcblxuICByZXR1cm4gcmVzcG9uc2UuZGF0YS5vcmRlci51cGRhdGU7XG59O1xuIiwiY29uc3QgeyBjYWxsT3JkZXJzQXBpIH0gPSByZXF1aXJlKFwiLi4vdXRpbHNcIik7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gd2FpdEZvck9yZGVyVG9CZVBlcnNpc3RhdGVkKHsgaWQgfSkge1xuICBsZXQgcmV0cmllcyA9IDA7XG4gIGNvbnN0IG1heFJldHJpZXMgPSAxMDtcblxuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIChhc3luYyBmdW5jdGlvbiBjaGVjaygpIHtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgY2FsbE9yZGVyc0FwaSh7XG4gICAgICAgIHF1ZXJ5OiBgXG4gICAgICAgICAge1xuICAgICAgICAgICAgb3JkZXJzIHtcbiAgICAgICAgICAgICAgZ2V0KGlkOiBcIiR7aWR9XCIpIHtcbiAgICAgICAgICAgICAgICBpZFxuICAgICAgICAgICAgICAgIGNyZWF0ZWRBdFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICBgLFxuICAgICAgfSk7XG5cbiAgICAgIGlmIChyZXNwb25zZS5kYXRhICYmIHJlc3BvbnNlLmRhdGEub3JkZXJzLmdldCkge1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXRyaWVzICs9IDE7XG4gICAgICAgIGlmIChyZXRyaWVzID4gbWF4UmV0cmllcykge1xuICAgICAgICAgIHJlamVjdChcbiAgICAgICAgICAgIGBUaW1lb3V0IG91dCB3YWl0aW5nIGZvciBDcnlzdGFsbGl6ZSBvcmRlciBcIiR7aWR9XCIgdG8gYmUgcGVyc2lzdGVkYFxuICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2V0VGltZW91dChjaGVjaywgMTAwMCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KSgpO1xuICB9KTtcbn07XG4iLCJjb25zdCBpbnZhcmlhbnQgPSByZXF1aXJlKFwiaW52YXJpYW50XCIpO1xuY29uc3QgZmV0Y2ggPSByZXF1aXJlKFwibm9kZS1mZXRjaFwiKTtcblxuY29uc3QgQ1JZU1RBTExJWkVfVEVOQU5UX0lERU5USUZJRVIgPSBwcm9jZXNzLmVudi5DUllTVEFMTElaRV9URU5BTlRfSURFTlRJRklFUjtcbmNvbnN0IENSWVNUQUxMSVpFX0FDQ0VTU19UT0tFTl9JRCA9IHByb2Nlc3MuZW52LkNSWVNUQUxMSVpFX0FDQ0VTU19UT0tFTl9JRDtcbmNvbnN0IENSWVNUQUxMSVpFX0FDQ0VTU19UT0tFTl9TRUNSRVQgPVxuICBwcm9jZXNzLmVudi5DUllTVEFMTElaRV9BQ0NFU1NfVE9LRU5fU0VDUkVUO1xuXG5pbnZhcmlhbnQoXG4gIENSWVNUQUxMSVpFX1RFTkFOVF9JREVOVElGSUVSLFxuICBcIk1pc3NpbmcgcHJvY2Vzcy5lbnYuQ1JZU1RBTExJWkVfVEVOQU5UX0lERU5USUZJRVJcIlxuKTtcblxuZnVuY3Rpb24gY3JlYXRlQXBpQ2FsbGVyKHVyaSkge1xuICByZXR1cm4gYXN5bmMgZnVuY3Rpb24gY2FsbEFwaSh7IHF1ZXJ5LCB2YXJpYWJsZXMsIG9wZXJhdGlvbk5hbWUgfSkge1xuICAgIGludmFyaWFudChcbiAgICAgIENSWVNUQUxMSVpFX0FDQ0VTU19UT0tFTl9JRCxcbiAgICAgIFwiTWlzc2luZyBwcm9jZXNzLmVudi5DUllTVEFMTElaRV9BQ0NFU1NfVE9LRU5fSURcIlxuICAgICk7XG4gICAgaW52YXJpYW50KFxuICAgICAgQ1JZU1RBTExJWkVfQUNDRVNTX1RPS0VOX1NFQ1JFVCxcbiAgICAgIFwiTWlzc2luZyBwcm9jZXNzLmVudi5DUllTVEFMTElaRV9BQ0NFU1NfVE9LRU5fU0VDUkVUXCJcbiAgICApO1xuXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmksIHtcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIFwiY29udGVudC10eXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgICBcIlgtQ3J5c3RhbGxpemUtQWNjZXNzLVRva2VuLUlkXCI6IENSWVNUQUxMSVpFX0FDQ0VTU19UT0tFTl9JRCxcbiAgICAgICAgXCJYLUNyeXN0YWxsaXplLUFjY2Vzcy1Ub2tlbi1TZWNyZXRcIjogQ1JZU1RBTExJWkVfQUNDRVNTX1RPS0VOX1NFQ1JFVCxcbiAgICAgIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IG9wZXJhdGlvbk5hbWUsIHF1ZXJ5LCB2YXJpYWJsZXMgfSksXG4gICAgfSk7XG5cbiAgICBjb25zdCBqc29uID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xuXG4gICAgaWYgKGpzb24uZXJyb3JzKSB7XG4gICAgICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShqc29uLmVycm9ycywgbnVsbCwgMikpO1xuICAgIH1cblxuICAgIHJldHVybiBqc29uO1xuICB9O1xufVxuXG5mdW5jdGlvbiBub3JtYWxpc2VPcmRlck1vZGVsKHsgY3VzdG9tZXIsIGNhcnQsIHRvdGFsLCAuLi5yZXN0IH0pIHtcbiAgcmV0dXJuIHtcbiAgICAuLi5yZXN0LFxuICAgIC4uLih0b3RhbCAmJiB7XG4gICAgICB0b3RhbDoge1xuICAgICAgICBncm9zczogdG90YWwuZ3Jvc3MsXG4gICAgICAgIG5ldDogdG90YWwubmV0LFxuICAgICAgICBjdXJyZW5jeTogdG90YWwuY3VycmVuY3ksXG4gICAgICAgIHRheDogdG90YWwudGF4LFxuICAgICAgfSxcbiAgICB9KSxcbiAgICAuLi4oY2FydCAmJiB7XG4gICAgICBjYXJ0OiBjYXJ0Lm1hcChmdW5jdGlvbiBoYW5kbGVPcmRlckNhcnRJdGVtKGl0ZW0pIHtcbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgIGltYWdlcyA9IFtdLFxuICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgc2t1LFxuICAgICAgICAgIHByb2R1Y3RJZCxcbiAgICAgICAgICBwcm9kdWN0VmFyaWFudElkLFxuICAgICAgICAgIHF1YW50aXR5LFxuICAgICAgICAgIHByaWNlLFxuICAgICAgICB9ID0gaXRlbTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgc2t1LFxuICAgICAgICAgIHByb2R1Y3RJZCxcbiAgICAgICAgICBwcm9kdWN0VmFyaWFudElkLFxuICAgICAgICAgIHF1YW50aXR5LFxuICAgICAgICAgIHByaWNlLFxuICAgICAgICAgIGltYWdlVXJsOiBpbWFnZXMgJiYgaW1hZ2VzWzBdICYmIGltYWdlc1swXS51cmwsXG4gICAgICAgIH07XG4gICAgICB9KSxcbiAgICB9KSxcbiAgICAuLi4oY3VzdG9tZXIgJiYge1xuICAgICAgY3VzdG9tZXI6IHtcbiAgICAgICAgZmlyc3ROYW1lOiBjdXN0b21lci5maXJzdE5hbWUgfHwgbnVsbCxcbiAgICAgICAgbGFzdE5hbWU6IGN1c3RvbWVyLmxhc3ROYW1lIHx8IG51bGwsXG4gICAgICAgIGFkZHJlc3NlczogY3VzdG9tZXIuYWRkcmVzc2VzIHx8IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICB0eXBlOiBcImJpbGxpbmdcIixcbiAgICAgICAgICAgIGVtYWlsOiBjdXN0b21lci5lbWFpbCB8fCB1bmRlZmluZWQsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgfSksXG4gIH07XG59XG5cbmNvbnN0IGdldFRlbmFudElkID0gKGZ1bmN0aW9uICgpIHtcbiAgbGV0IHRlbmFudElkO1xuXG4gIHJldHVybiBhc3luYyAoKSA9PiB7XG4gICAgaWYgKHRlbmFudElkKSB7XG4gICAgICByZXR1cm4gdGVuYW50SWQ7XG4gICAgfVxuXG4gICAgY29uc3QgdGVuYW50SWRSZXNwb25zZSA9IGF3YWl0IGNhbGxDYXRhbG9ndWVBcGkoe1xuICAgICAgcXVlcnk6IGBcbiAgICAgICAgICB7XG4gICAgICAgICAgICB0ZW5hbnQge1xuICAgICAgICAgICAgICBpZFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgYCxcbiAgICB9KTtcbiAgICB0ZW5hbnRJZCA9IHRlbmFudElkUmVzcG9uc2UuZGF0YS50ZW5hbnQuaWQ7XG5cbiAgICByZXR1cm4gdGVuYW50SWQ7XG4gIH07XG59KSgpO1xuXG4vKipcbiAqIENhdGFsb2d1ZSBBUEkgaXMgdGhlIGZhc3QgcmVhZC1vbmx5IEFQSSB0byBsb29rdXAgZGF0YVxuICogZm9yIGEgZ2l2ZW4gaXRlbSBwYXRoIG9yIGFueXRoaW5nIGVsc2UgaW4gdGhlIGNhdGFsb2d1ZVxuICovXG5jb25zdCBjYWxsQ2F0YWxvZ3VlQXBpID0gY3JlYXRlQXBpQ2FsbGVyKFxuICBgaHR0cHM6Ly9hcGkuY3J5c3RhbGxpemUuY29tLyR7Q1JZU1RBTExJWkVfVEVOQU5UX0lERU5USUZJRVJ9L2NhdGFsb2d1ZWBcbik7XG5cbi8qKlxuICogU2VhcmNoIEFQSSBpcyB0aGUgZmFzdCByZWFkLW9ubHkgQVBJIHRvIHNlYXJjaCBhY3Jvc3NcbiAqIGFsbCBpdGVtcyBhbmQgdG9waWNzXG4gKi9cbmNvbnN0IGNhbGxTZWFyY2hBcGkgPSBjcmVhdGVBcGlDYWxsZXIoXG4gIGBodHRwczovL2FwaS5jcnlzdGFsbGl6ZS5jb20vJHtDUllTVEFMTElaRV9URU5BTlRfSURFTlRJRklFUn0vc2VhcmNoYFxuKTtcblxuLyoqXG4gKiBPcmRlcnMgQVBJIGlzIHRoZSBoaWdobHkgc2NhbGFibGUgQVBJIHRvIHNlbmQvcmVhZCBtYXNzaXZlXG4gKiBhbW91bnRzIG9mIG9yZGVyc1xuICovXG5jb25zdCBjYWxsT3JkZXJzQXBpID0gY3JlYXRlQXBpQ2FsbGVyKFxuICBgaHR0cHM6Ly9hcGkuY3J5c3RhbGxpemUuY29tLyR7Q1JZU1RBTExJWkVfVEVOQU5UX0lERU5USUZJRVJ9L29yZGVyc2Bcbik7XG5cbi8qKlxuICogVGhlIFBJTSBBUEkgaXMgdXNlZCBmb3IgZG9pbmcgdGhlIEFMTCBwb3NzaWJsZSBhY3Rpb25zIG9uXG4gKiBhIHRlbmFudCBvciB5b3VyIHVzZXIgcHJvZmlsZVxuICovXG5jb25zdCBjYWxsUGltQXBpID0gY3JlYXRlQXBpQ2FsbGVyKFwiaHR0cHM6Ly9waW0uY3J5c3RhbGxpemUuY29tL2dyYXBocWxcIik7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBub3JtYWxpc2VPcmRlck1vZGVsLFxuICBjYWxsQ2F0YWxvZ3VlQXBpLFxuICBjYWxsU2VhcmNoQXBpLFxuICBjYWxsT3JkZXJzQXBpLFxuICBjYWxsUGltQXBpLFxuICBnZXRUZW5hbnRJZCxcbn07XG4iLCJjb25zdCB7IHNlbmRFbWFpbCB9ID0gcmVxdWlyZShcIi4vdXRpbHNcIik7XG5cbmNvbnN0IHNlbmRPcmRlckNvbmZpcm1hdGlvbiA9IHJlcXVpcmUoXCIuL29yZGVyLWNvbmZpcm1hdGlvblwiKTtcbmNvbnN0IHNlbmRVc2VyTWFnaWNMaW5rID0gcmVxdWlyZShcIi4vdXNlci1tYWdpYy1saW5rXCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgc2VuZEVtYWlsLFxuICBzZW5kT3JkZXJDb25maXJtYXRpb24sXG4gIHNlbmRVc2VyTWFnaWNMaW5rLFxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gYXN5bmMgZnVuY3Rpb24gc2VuZE9yZGVyQ29uZmlybWF0aW9uKG9yZGVySWQpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBtam1sMmh0bWwgPSByZXF1aXJlKFwibWptbFwiKTtcblxuICAgIGNvbnN0IHsgZm9ybWF0Q3VycmVuY3kgfSA9IHJlcXVpcmUoXCIuLi8uLi9saWIvY3VycmVuY3lcIik7XG4gICAgY29uc3QgeyBvcmRlcnMgfSA9IHJlcXVpcmUoXCIuLi9jcnlzdGFsbGl6ZVwiKTtcbiAgICBjb25zdCB7IHNlbmRFbWFpbCB9ID0gcmVxdWlyZShcIi4vdXRpbHNcIik7XG5cbiAgICBjb25zdCBvcmRlciA9IGF3YWl0IG9yZGVycy5nZXQob3JkZXJJZCk7XG5cbiAgICBjb25zdCB7IGVtYWlsIH0gPSBvcmRlci5jdXN0b21lci5hZGRyZXNzZXNbMF07XG5cbiAgICBpZiAoIWVtYWlsKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgZXJyb3I6IFwiTm8gZW1haWwgaXMgY29ubnRlY3RlZCB3aXRoIHRoZSBjdXN0b21lciBvYmplY3RcIixcbiAgICAgIH07XG4gICAgfVxuXG4gICAgY29uc3QgeyBodG1sIH0gPSBtam1sMmh0bWwoYFxuICAgICAgPG1qbWw+XG4gICAgICAgIDxtai1ib2R5PlxuICAgICAgICA8bWotc2VjdGlvbj5cbiAgICAgICAgICA8bWotY29sdW1uPlxuICAgICAgICAgICAgPG1qLXRleHQ+XG4gICAgICAgICAgICAgIDxoMT5PcmRlciBTdW1tYXJ5PC9oMT5cbiAgICAgICAgICAgICAgPHA+VGhhbmtzIGZvciB5b3VyIG9yZGVyISBUaGlzIGVtYWlsIGNvbnRhaW5zIGEgY29weSBvZiB5b3VyIG9yZGVyIGZvciB5b3VyIHJlZmVyZW5jZS48L3A+XG4gICAgICAgICAgICAgIDxwPlxuICAgICAgICAgICAgICAgIE9yZGVyIE51bWJlcjogPHN0cm9uZz4jJHtvcmRlci5pZH08L3N0cm9uZz5cbiAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICA8cD5cbiAgICAgICAgICAgICAgICBGaXJzdCBuYW1lOiA8c3Ryb25nPiR7b3JkZXIuY3VzdG9tZXIuZmlyc3ROYW1lfTwvc3Ryb25nPjxiciAvPlxuICAgICAgICAgICAgICAgIExhc3QgbmFtZTogPHN0cm9uZz4ke29yZGVyLmN1c3RvbWVyLmxhc3ROYW1lfTwvc3Ryb25nPjxiciAvPlxuICAgICAgICAgICAgICAgIEVtYWlsIGFkZHJlc3M6IDxzdHJvbmc+JHtlbWFpbH08L3N0cm9uZz5cbiAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICA8cD5cbiAgICAgICAgICAgICAgICBUb3RhbDogPHN0cm9uZz4ke2Zvcm1hdEN1cnJlbmN5KHtcbiAgICAgICAgICAgICAgICAgIGFtb3VudDogb3JkZXIudG90YWwuZ3Jvc3MsXG4gICAgICAgICAgICAgICAgICBjdXJyZW5jeTogb3JkZXIudG90YWwuY3VycmVuY3ksXG4gICAgICAgICAgICAgICAgfSl9PC9zdHJvbmc+XG4gICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgIDwvbWotdGV4dD5cbiAgICAgICAgICAgIDxtai10YWJsZT5cbiAgICAgICAgICAgICAgPHRyIHN0eWxlPVwiYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICNlY2VkZWU7IHRleHQtYWxpZ246IGxlZnQ7XCI+XG4gICAgICAgICAgICAgICAgPHRoIHN0eWxlPVwicGFkZGluZzogMCAxNXB4IDAgMDtcIj5OYW1lPC90aD5cbiAgICAgICAgICAgICAgICA8dGggc3R5bGU9XCJwYWRkaW5nOiAwIDE1cHg7XCI+UXVhbnRpdHk8L3RoPlxuICAgICAgICAgICAgICAgIDx0aCBzdHlsZT1cInBhZGRpbmc6IDAgMCAwIDE1cHg7XCI+VG90YWw8L3RoPlxuICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAke29yZGVyLmNhcnQubWFwKFxuICAgICAgICAgICAgICAgIChpdGVtKSA9PiBgPHRyPlxuICAgICAgICAgICAgICAgICAgPHRkIHN0eWxlPVwicGFkZGluZzogMCAxNXB4IDAgMDtcIj4ke2l0ZW0ubmFtZX0gKCR7XG4gICAgICAgICAgICAgICAgICBpdGVtLnNrdVxuICAgICAgICAgICAgICAgIH0pPC90ZD5cbiAgICAgICAgICAgICAgICAgIDx0ZCBzdHlsZT1cInBhZGRpbmc6IDAgMTVweDtcIj4ke2l0ZW0ucXVhbnRpdHl9PC90ZD5cbiAgICAgICAgICAgICAgICAgIDx0ZCBzdHlsZT1cInBhZGRpbmc6IDAgMCAwIDE1cHg7XCI+JHtmb3JtYXRDdXJyZW5jeSh7XG4gICAgICAgICAgICAgICAgICAgIGFtb3VudDogaXRlbS5wcmljZS5ncm9zcyAqIGl0ZW0ucXVhbnRpdHksXG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbmN5OiBpdGVtLnByaWNlLmN1cnJlbmN5LFxuICAgICAgICAgICAgICAgICAgfSl9PC90ZD5cbiAgICAgICAgICAgICAgICA8L3RyPmBcbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDwvbWotdGFibGU+XG4gICAgICAgICAgPC9tai1jb2x1bW4+XG4gICAgICAgIDwvbWotc2VjdGlvbj5cbiAgICAgICAgPC9tai1ib2R5PlxuICAgICAgPC9tam1sPlxuICAgIGApO1xuXG4gICAgYXdhaXQgc2VuZEVtYWlsKHtcbiAgICAgIHRvOiBlbWFpbCxcbiAgICAgIHN1YmplY3Q6IFwiT3JkZXIgc3VtbWFyeVwiLFxuICAgICAgaHRtbCxcbiAgICB9KTtcblxuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgIH07XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIGVycm9yLFxuICAgIH07XG4gIH1cbn07XG4iLCJjb25zdCB7IHNlbmRFbWFpbCB9ID0gcmVxdWlyZShcIi4vdXRpbHNcIik7XG5cbm1vZHVsZS5leHBvcnRzID0gYXN5bmMgZnVuY3Rpb24gc2VuZE1hZ2ljTGlua0xvZ2luKHsgbG9naW5MaW5rLCBlbWFpbCB9KSB7XG4gIHRyeSB7XG4gICAgY29uc3QgbWptbDJodG1sID0gcmVxdWlyZShcIm1qbWxcIik7XG4gICAgY29uc3QgeyBodG1sIH0gPSBtam1sMmh0bWwoYFxuICAgICAgPG1qbWw+XG4gICAgICAgIDxtai1ib2R5PlxuICAgICAgICAgIDxtai1zZWN0aW9uPlxuICAgICAgICAgICAgPG1qLWNvbHVtbj5cbiAgICAgICAgICAgICAgPG1qLXRleHQ+SGkgdGhlcmUhIFNpbXBseSBmb2xsb3cgdGhlIGxpbmsgYmVsb3cgdG8gbG9naW4uPC9tai10ZXh0PlxuICAgICAgICAgICAgICA8bWotYnV0dG9uIGhyZWY9XCIke2xvZ2luTGlua31cIiBhbGlnbj1cImxlZnRcIj5DbGljayBoZXJlIHRvIGxvZ2luPC9tai1idXR0b24+XG4gICAgICAgICAgICA8L21qLWNvbHVtbj5cbiAgICAgICAgICA8L21qLXNlY3Rpb24+XG4gICAgICAgIDwvbWotYm9keT5cbiAgICAgIDwvbWptbD5cbiAgICBgKTtcblxuICAgIGF3YWl0IHNlbmRFbWFpbCh7XG4gICAgICB0bzogZW1haWwsXG4gICAgICBzdWJqZWN0OiBcIk1hZ2ljIGxpbmsgbG9naW5cIixcbiAgICAgIGh0bWwsXG4gICAgfSk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICB9O1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBlcnJvcixcbiAgICB9O1xuICB9XG59O1xuIiwiY29uc3QgaW52YXJpYW50ID0gcmVxdWlyZShcImludmFyaWFudFwiKTtcblxuY29uc3QgU0VOREdSSURfQVBJX0tFWSA9IHByb2Nlc3MuZW52LlNFTkRHUklEX0FQSV9LRVk7XG5jb25zdCBFTUFJTF9GUk9NID0gcHJvY2Vzcy5lbnYuRU1BSUxfRlJPTTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIHNlbmRFbWFpbChhcmdzKSB7XG4gICAgaW52YXJpYW50KFNFTkRHUklEX0FQSV9LRVksIFwicHJvY2Vzcy5lbnYuU0VOREdSSURfQVBJX0tFWSBub3QgZGVmaW5lZFwiKTtcbiAgICBpbnZhcmlhbnQoRU1BSUxfRlJPTSwgXCJwcm9jZXNzLmVudi5FTUFJTF9GUk9NIGlzIG5vdCBkZWZpbmVkXCIpO1xuXG4gICAgY29uc3Qgc2dNYWlsID0gcmVxdWlyZShcIkBzZW5kZ3JpZC9tYWlsXCIpO1xuICAgIHNnTWFpbC5zZXRBcGlLZXkoU0VOREdSSURfQVBJX0tFWSk7XG5cbiAgICByZXR1cm4gc2dNYWlsLnNlbmQoe1xuICAgICAgZnJvbTogRU1BSUxfRlJPTSxcbiAgICAgIC4uLmFyZ3MsXG4gICAgfSk7XG4gIH0sXG59O1xuIiwiLyoqXG4gKiBBbiBleGFtcGxlIG9mIGhvdyB0byBjYXB0dXJlIGFuIGFtb3VudCBmb3Igb24gYW5cbiAqIG9yZGVyLiBZb3Ugd291bGQgdHlwaWNhbGx5IGRvIHRoaXMgYXMgYSByZXNwb25zZSB0b1xuICogYW4gdXBkYXRlIG9mIGEgRnVsZmlsbWVudCBQaXBlbGFuZSBTdGFnZSBjaGFuZ2UgaW5cbiAqIENyeXN0YWxsaXplIChodHRwczovL2NyeXN0YWxsaXplLmNvbS9sZWFybi9kZXZlbG9wZXItZ3VpZGVzL29yZGVyLWFwaS9mdWxmaWxtZW50LXBpcGVsaW5lcylcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGFzeW5jIGZ1bmN0aW9uIGtsYXJuYUNhcHR1cmUoeyBjcnlzdGFsbGl6ZU9yZGVySWQgfSkge1xuICBjb25zdCBjcnlzdGFsbGl6ZSA9IHJlcXVpcmUoXCIuLi8uLi9jcnlzdGFsbGl6ZVwiKTtcbiAgY29uc3QgeyBnZXRDbGllbnQgfSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpO1xuXG4gIC8vIFJldHJpZXZlIHRoZSBDcnlzdGFsbGl6ZSBvcmRlclxuICBjb25zdCBjcnlzdGFsbGl6ZU9yZGVyID0gYXdhaXQgY3J5c3RhbGxpemUub3JkZXJzLmdldChjcnlzdGFsbGl6ZU9yZGVySWQpO1xuICBjb25zdCBrbGFybmFQYXltZW50ID0gY3J5c3RhbGxpemVPcmRlci5wYXltZW50LmZpbmQoXG4gICAgKHApID0+IHAucHJvdmlkZXIgPT09IFwia2xhcm5hXCJcbiAgKTtcbiAgaWYgKCFrbGFybmFQYXltZW50KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBPcmRlciAke2NyeXN0YWxsaXplT3JkZXJJZH0gaGFzIG5vIEtsYXJuYSBwYXltZW50YCk7XG4gIH1cbiAgY29uc3Qga2xhcm5hT3JkZXJJZCA9IGtsYXJuYVBheW1lbnQub3JkZXJJZDtcbiAgaWYgKCFrbGFybmFPcmRlcklkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBPcmRlciAke2NyeXN0YWxsaXplT3JkZXJJZH0gaGFzIG5vIGtsYXJuYU9yZGVySWRgKTtcbiAgfVxuXG4gIGNvbnN0IGtsYXJuYUNsaWVudCA9IGF3YWl0IGdldENsaWVudCgpO1xuXG4gIC8vIENhcHR1cmUgdGhlIGZ1bGwgYW1vdW50IGZvciB0aGUgb3JkZXJcbiAgY29uc3Qge1xuICAgIGVycm9yLFxuICAgIHJlc3BvbnNlLFxuICB9ID0gYXdhaXQga2xhcm5hQ2xpZW50Lm9yZGVybWFuYWdlbWVudFYxLmNhcHR1cmVzLmNhcHR1cmUoa2xhcm5hT3JkZXJJZCk7XG5cbiAgY29uc29sZS5sb2coZXJyb3IsIHJlc3BvbnNlKTtcblxuICAvKipcbiAgICogWW91IHdvdWxkIHR5cGljYWxseSBhbHNvIG1vdmUgdGhlIG9yZGVyIGluIHRoZVxuICAgKiBmdWxmaWxtZW50IHBpcGVsaW5lIGZyb20gYSBzdGFnZSBjYWxsZWQgZS5nLlxuICAgKiBcImNyZWF0ZWRcIiB0byBcInB1cmNoYXNlZFwiIGhlcmVcbiAgICovXG59O1xuIiwiY29uc3QgS0xBUk5BX1VTRVJOQU1FID0gcHJvY2Vzcy5lbnYuS0xBUk5BX1VTRVJOQU1FO1xuY29uc3QgS0xBUk5BX1BBU1NXT1JEID0gcHJvY2Vzcy5lbnYuS0xBUk5BX1BBU1NXT1JEO1xuXG5jb25zdCB7IGdldENsaWVudCB9ID0gcmVxdWlyZShcIi4vdXRpbHNcIik7XG5cbmNvbnN0IHJlbmRlckNoZWNrb3V0ID0gcmVxdWlyZShcIi4vcmVuZGVyLWNoZWNrb3V0XCIpO1xuY29uc3QgcHVzaCA9IHJlcXVpcmUoXCIuL3B1c2hcIik7XG5jb25zdCBjYXB0dXJlID0gcmVxdWlyZShcIi4vY2FwdHVyZVwiKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGVuYWJsZWQ6IEJvb2xlYW4oS0xBUk5BX1VTRVJOQU1FICYmIEtMQVJOQV9QQVNTV09SRCksXG4gIGZyb250ZW5kQ29uZmlnOiB7fSxcbiAgZ2V0Q2xpZW50LFxuICByZW5kZXJDaGVja291dCxcbiAgcHVzaCxcbiAgY2FwdHVyZSxcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGFzeW5jIGZ1bmN0aW9uIGtsYXJuYVB1c2goe1xuICBjcnlzdGFsbGl6ZU9yZGVySWQsXG4gIGtsYXJuYU9yZGVySWQsXG59KSB7XG4gIGNvbnN0IHsgZ2V0Q2xpZW50IH0gPSByZXF1aXJlKFwiLi91dGlsc1wiKTtcbiAgY29uc29sZS5sb2coXCJLbGFybmEgcHVzaFwiLCB7IGNyeXN0YWxsaXplT3JkZXJJZCwga2xhcm5hT3JkZXJJZCB9KTtcblxuICBjb25zdCBrbGFybmFDbGllbnQgPSBhd2FpdCBnZXRDbGllbnQoKTtcblxuICAvLyBSZXRyaWV2ZSB0aGUgS2xhcm5hIG9yZGVyIHRvIGdldCB0aGUgcGF5bWVudCBzdGF0dXNcblxuICAvLyBBY2tub3dsZWRnZSB0aGUgS2xhcm5hIG9yZGVyXG4gIGF3YWl0IGtsYXJuYUNsaWVudC5vcmRlcm1hbmFnZW1lbnRWMS5vcmRlcnMuYWNrbm93bGVkZ2Uoa2xhcm5hT3JkZXJJZCk7XG5cbiAgLyoqXG4gICAqIFlvdSB3b3VsZCB0eXBpY2FsbHkgYWxzbyBtb3ZlIHRoZSBvcmRlciBpbiB0aGVcbiAgICogZnVsZmlsbWVudCBwaXBlbGluZSBmcm9tIGEgc3RhZ2UgY2FsbGVkIGUuZy5cbiAgICogXCJpbml0aWFsXCIgdG8gXCJjcmVhdGVkXCIgaGVyZVxuICAgKi9cbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGFzeW5jIGZ1bmN0aW9uIHJlbmRlckNoZWNrb3V0KHsgY2hlY2tvdXRNb2RlbCwgY29udGV4dCB9KSB7XG4gIGNvbnN0IGNyeXN0YWxsaXplID0gcmVxdWlyZShcIi4uLy4uL2NyeXN0YWxsaXplXCIpO1xuICBjb25zdCBiYXNrZXRTZXJ2aWNlID0gcmVxdWlyZShcIi4uLy4uL2Jhc2tldC1zZXJ2aWNlXCIpO1xuXG4gIGNvbnN0IHsgZ2V0Q2xpZW50IH0gPSByZXF1aXJlKFwiLi91dGlsc1wiKTtcbiAgY29uc3QgdG9LbGFybmFPcmRlck1vZGVsID0gcmVxdWlyZShcIi4vdG8ta2xhcm5hLW9yZGVyLW1vZGVsXCIpO1xuXG4gIGNvbnN0IHtcbiAgICBiYXNrZXRNb2RlbCxcbiAgICBjdXN0b21lcixcbiAgICBjb25maXJtYXRpb25VUkwsXG4gICAgdGVybXNVUkwsXG4gICAgY2hlY2tvdXRVUkwsXG4gIH0gPSBjaGVja291dE1vZGVsO1xuICBjb25zdCB7IHNlcnZpY2VDYWxsYmFja0hvc3QsIHVzZXIgfSA9IGNvbnRleHQ7XG5cbiAgbGV0IHsgY3J5c3RhbGxpemVPcmRlcklkLCBrbGFybmFPcmRlcklkIH0gPSBiYXNrZXRNb2RlbDtcblxuICBjb25zdCBiYXNrZXQgPSBhd2FpdCBiYXNrZXRTZXJ2aWNlLmdldCh7IGJhc2tldE1vZGVsLCBjb250ZXh0IH0pO1xuXG4gIC8vIEFkZCB0aGUgaWRlbnRpZmllciBmcm9tIHRoZSBjdXJyZW50IGxvZ2dlZCBpbiB1c2VyXG4gIGNvbnN0IGN1c3RvbWVyV2l0aEN1cnJlbnRMb2dnZWRJblVzZXIgPSB7XG4gICAgLi4uY3VzdG9tZXIsXG4gICAgaWRlbnRpZmllcjogdXNlci5lbWFpbCxcbiAgfTtcblxuICAvKipcbiAgICogVXNlIGEgQ3J5c3RhbGxpemUgb3JkZXIgYW5kIHRoZSBmdWxmaWxtZW50IHBpcGVsaW5lcyB0b1xuICAgKiBtYW5hZ2UgdGhlIGxpZmVjeWNsZSBvZiB0aGUgb3JkZXJcbiAgICovXG4gIGlmIChjcnlzdGFsbGl6ZU9yZGVySWQpIHtcbiAgICBhd2FpdCBjcnlzdGFsbGl6ZS5vcmRlcnMudXBkYXRlKGNyeXN0YWxsaXplT3JkZXJJZCwge1xuICAgICAgLi4uYmFza2V0LFxuICAgICAgY3VzdG9tZXI6IGN1c3RvbWVyV2l0aEN1cnJlbnRMb2dnZWRJblVzZXIsXG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgY3J5c3RhbGxpemVPcmRlciA9IGF3YWl0IGNyeXN0YWxsaXplLm9yZGVycy5jcmVhdGUoe1xuICAgICAgLi4uYmFza2V0LFxuICAgICAgY3VzdG9tZXI6IGN1c3RvbWVyV2l0aEN1cnJlbnRMb2dnZWRJblVzZXIsXG4gICAgfSk7XG4gICAgY3J5c3RhbGxpemVPcmRlcklkID0gY3J5c3RhbGxpemVPcmRlci5pZDtcbiAgfVxuXG4gIC8vIFNldHVwIHRoZSBjb25maXJtYXRpb24gVVJMXG4gIGNvbnN0IGNvbmZpcm1hdGlvbiA9IG5ldyBVUkwoXG4gICAgY29uZmlybWF0aW9uVVJMLnJlcGxhY2UoXCJ7Y3J5c3RhbGxpemVPcmRlcklkfVwiLCBjcnlzdGFsbGl6ZU9yZGVySWQpXG4gICk7XG4gIGNvbmZpcm1hdGlvbi5zZWFyY2hQYXJhbXMuYXBwZW5kKFwia2xhcm5hT3JkZXJJZFwiLCBcIntjaGVja291dC5vcmRlci5pZH1cIik7XG5cbiAgY29uc3QgdmFsaWRLbGFybmFPcmRlck1vZGVsID0ge1xuICAgIC4uLnRvS2xhcm5hT3JkZXJNb2RlbChiYXNrZXQpLFxuICAgIHB1cmNoYXNlX2NvdW50cnk6IFwiTk9cIixcbiAgICBwdXJjaGFzZV9jdXJyZW5jeTogYmFza2V0LnRvdGFsLmN1cnJlbmN5IHx8IFwiTk9LXCIsXG4gICAgbG9jYWxlOiBcIm5vLW5iXCIsXG4gICAgbWVyY2hhbnRfdXJsczoge1xuICAgICAgdGVybXM6IHRlcm1zVVJMLFxuICAgICAgY2hlY2tvdXQ6IGNoZWNrb3V0VVJMLFxuICAgICAgY29uZmlybWF0aW9uOiBjb25maXJtYXRpb24udG9TdHJpbmcoKSxcbiAgICAgIHB1c2g6IGAke3NlcnZpY2VDYWxsYmFja0hvc3R9L3dlYmhvb2tzL3BheW1lbnQtcHJvdmlkZXJzL2tsYXJuYS9wdXNoP2NyeXN0YWxsaXplT3JkZXJJZD0ke2NyeXN0YWxsaXplT3JkZXJJZH0ma2xhcm5hT3JkZXJJZD17Y2hlY2tvdXQub3JkZXIuaWR9YCxcbiAgICB9LFxuICB9O1xuXG4gIGNvbnN0IGtsYXJuYUNsaWVudCA9IGF3YWl0IGdldENsaWVudCgpO1xuXG4gIC8qKlxuICAgKiBIb2xkIHRoZSBIVE1MIHNuaXBwZXQgdGhhdCB3aWxsIGJlIHVzZWQgb24gdGhlXG4gICAqIGZyb250ZW5kIHRvIGRpc3BsYXkgdGhlIEtsYXJuYSBjaGVja291dFxuICAgKi9cbiAgbGV0IGh0bWwgPSBcIlwiO1xuXG4gIC8qKlxuICAgKiBUaGVyZSBpcyBhbHJlYWR5IGEgS2xhcm5hIG9yZGVyIGlkIGZvciB0aGlzIHVzZXJcbiAgICogc2Vzc2lvbiwgbGV0J3MgdXNlIHRoYXQgYW5kIG5vdCBjcmVhdGUgYSBuZXcgb25lXG4gICAqL1xuICBpZiAoa2xhcm5hT3JkZXJJZCkge1xuICAgIGNvbnN0IHsgZXJyb3IsIHJlc3BvbnNlIH0gPSBhd2FpdCBrbGFybmFDbGllbnQuY2hlY2tvdXRWMy51cGRhdGVPcmRlcihcbiAgICAgIGtsYXJuYU9yZGVySWQsXG4gICAgICB2YWxpZEtsYXJuYU9yZGVyTW9kZWxcbiAgICApO1xuXG4gICAgaWYgKCFlcnJvcikge1xuICAgICAgaHRtbCA9IHJlc3BvbnNlLmh0bWxfc25pcHBldDtcbiAgICAgIGtsYXJuYU9yZGVySWQgPSByZXNwb25zZS5vcmRlcl9pZDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGVycm9yKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgeyBlcnJvciwgcmVzcG9uc2UgfSA9IGF3YWl0IGtsYXJuYUNsaWVudC5jaGVja291dFYzLmNyZWF0ZU9yZGVyKFxuICAgICAgdmFsaWRLbGFybmFPcmRlck1vZGVsXG4gICAgKTtcblxuICAgIGlmICghZXJyb3IpIHtcbiAgICAgIGh0bWwgPSByZXNwb25zZS5odG1sX3NuaXBwZXQ7XG4gICAgICBrbGFybmFPcmRlcklkID0gcmVzcG9uc2Uub3JkZXJfaWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvcik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBDcnlzdGFsbGl6ZSBvcmRlciBjcmVhdGluZyBpcyBhc3luY2hyb25vdXMsIHNvIHdlIGhhdmVcbiAgICogdG8gd2FpdCBmb3IgdGhlIG9yZGVyIHRvIGJlIGZ1bGx5IHBlcnNpc3RlZFxuICAgKi9cbiAgYXdhaXQgY3J5c3RhbGxpemUub3JkZXJzLndhaXRGb3JPcmRlclRvQmVQZXJzaXN0YXRlZCh7XG4gICAgaWQ6IGNyeXN0YWxsaXplT3JkZXJJZCxcbiAgfSk7XG5cbiAgLy8gVGFnIHRoZSBDcnlzdGFsbGl6ZSBvcmRlciB3aXRoIHRoZSBLbGFybmEgb3JkZXIgaWRcbiAgYXdhaXQgY3J5c3RhbGxpemUub3JkZXJzLnVwZGF0ZShjcnlzdGFsbGl6ZU9yZGVySWQsIHtcbiAgICAuLi5iYXNrZXQsXG4gICAgcGF5bWVudDogW1xuICAgICAge1xuICAgICAgICBwcm92aWRlcjogXCJrbGFybmFcIixcbiAgICAgICAga2xhcm5hOiB7XG4gICAgICAgICAgb3JkZXJJZDoga2xhcm5hT3JkZXJJZCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgXSxcbiAgfSk7XG5cbiAgcmV0dXJuIHtcbiAgICBodG1sLFxuICAgIGtsYXJuYU9yZGVySWQsXG4gICAgY3J5c3RhbGxpemVPcmRlcklkLFxuICB9O1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY3J5c3RhbGxpemVUb0tsYXJuYU9yZGVyTW9kZWwoYmFza2V0KSB7XG4gIGNvbnN0IHsgdG90YWwsIGNhcnQgfSA9IGJhc2tldDtcblxuICBjb25zdCBvcmRlcl9hbW91bnQgPSB0b3RhbC5ncm9zcyAqIDEwMDtcblxuICByZXR1cm4ge1xuICAgIG9yZGVyX2Ftb3VudCxcbiAgICBvcmRlcl90YXhfYW1vdW50OiBvcmRlcl9hbW91bnQgLSB0b3RhbC5uZXQgKiAxMDAsXG4gICAgb3JkZXJfbGluZXM6IGNhcnQubWFwKFxuICAgICAgKHtcbiAgICAgICAgc2t1LFxuICAgICAgICBxdWFudGl0eSxcbiAgICAgICAgcHJpY2UsXG4gICAgICAgIG5hbWUsXG4gICAgICAgIHByb2R1Y3RJZCxcbiAgICAgICAgcHJvZHVjdFZhcmlhbnRJZCxcbiAgICAgICAgaW1hZ2VVcmwsXG4gICAgICB9KSA9PiB7XG4gICAgICAgIGNvbnN0IHsgZ3Jvc3MsIG5ldCwgdGF4IH0gPSBwcmljZTtcbiAgICAgICAgY29uc3QgdW5pdF9wcmljZSA9IGdyb3NzICogMTAwO1xuXG4gICAgICAgIGlmIChza3Uuc3RhcnRzV2l0aChcIi0tdm91Y2hlci0tXCIpKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlZmVyZW5jZTogc2t1LFxuICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgIHF1YW50aXR5OiAxLFxuICAgICAgICAgICAgdW5pdF9wcmljZSxcbiAgICAgICAgICAgIHRvdGFsX2Ftb3VudDogdW5pdF9wcmljZSxcbiAgICAgICAgICAgIHRvdGFsX3RheF9hbW91bnQ6IDAsXG4gICAgICAgICAgICB0YXhfcmF0ZTogMCxcbiAgICAgICAgICAgIHR5cGU6IFwiZGlzY291bnRcIixcbiAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdG90YWxfYW1vdW50ID0gdW5pdF9wcmljZSAqIHF1YW50aXR5O1xuICAgICAgICBjb25zdCB0b3RhbF90YXhfYW1vdW50ID0gdG90YWxfYW1vdW50IC0gbmV0ICogcXVhbnRpdHkgKiAxMDA7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBuYW1lLFxuICAgICAgICAgIHJlZmVyZW5jZTogc2t1LFxuICAgICAgICAgIHVuaXRfcHJpY2UsXG4gICAgICAgICAgcXVhbnRpdHksXG4gICAgICAgICAgdG90YWxfYW1vdW50LFxuICAgICAgICAgIHRvdGFsX3RheF9hbW91bnQsXG4gICAgICAgICAgdHlwZTogXCJwaHlzaWNhbFwiLFxuICAgICAgICAgIHRheF9yYXRlOiB0YXgucGVyY2VudCAqIDEwMCxcbiAgICAgICAgICBpbWFnZV91cmw6IGltYWdlVXJsLFxuICAgICAgICAgIG1lcmNoYW50X2RhdGE6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIHByb2R1Y3RJZCxcbiAgICAgICAgICAgIHByb2R1Y3RWYXJpYW50SWQsXG4gICAgICAgICAgICB0YXhHcm91cDogdGF4LFxuICAgICAgICAgIH0pLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgICksXG4gIH07XG59O1xuIiwiLyoqXG4gKiBSZWFkIG1vcmUgYWJvdXQgaG93IHRvIHRhbGsgdG8gdGhlIEtsYXJuYSBBUEkgaGVyZTpcbiAqIGh0dHBzOi8vZGV2ZWxvcGVycy5rbGFybmEuY29tL2FwaS8jaW50cm9kdWN0aW9uXG4gKi9cblxuY29uc3QgaW52YXJpYW50ID0gcmVxdWlyZShcImludmFyaWFudFwiKTtcblxuY29uc3QgS0xBUk5BX1VTRVJOQU1FID0gcHJvY2Vzcy5lbnYuS0xBUk5BX1VTRVJOQU1FO1xuY29uc3QgS0xBUk5BX1BBU1NXT1JEID0gcHJvY2Vzcy5lbnYuS0xBUk5BX1BBU1NXT1JEO1xuXG5sZXQgY2xpZW50O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZ2V0Q2xpZW50OiAoKSA9PiB7XG4gICAgY29uc3QgeyBLbGFybmEgfSA9IHJlcXVpcmUoXCJAY3J5c3RhbGxpemUvbm9kZS1rbGFybmFcIik7XG5cbiAgICBpbnZhcmlhbnQoS0xBUk5BX1VTRVJOQU1FLCBcInByb2Nlc3MuZW52LktMQVJOQV9VU0VSTkFNRSBpcyBub3QgZGVmaW5lZFwiKTtcbiAgICBpbnZhcmlhbnQoS0xBUk5BX1BBU1NXT1JELCBcInByb2Nlc3MuZW52LktMQVJOQV9QQVNTV09SRCBpcyBub3QgZGVmaW5lZFwiKTtcblxuICAgIGlmICghY2xpZW50ICYmIEtMQVJOQV9VU0VSTkFNRSAmJiBLTEFSTkFfUEFTU1dPUkQpIHtcbiAgICAgIGNsaWVudCA9IG5ldyBLbGFybmEoe1xuICAgICAgICB1c2VybmFtZTogS0xBUk5BX1VTRVJOQU1FLFxuICAgICAgICBwYXNzd29yZDogS0xBUk5BX1BBU1NXT1JELFxuICAgICAgICBhcGlFbmRwb2ludDogXCJhcGkucGxheWdyb3VuZC5rbGFybmEuY29tXCIsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gY2xpZW50O1xuICB9LFxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gYXN5bmMgZnVuY3Rpb24gY3JlYXRlTW9sbGllUGF5bWVudCh7XG4gIGNoZWNrb3V0TW9kZWwsXG4gIGNvbnRleHQsXG59KSB7XG4gIGNvbnN0IGJhc2tldFNlcnZpY2UgPSByZXF1aXJlKFwiLi4vLi4vYmFza2V0LXNlcnZpY2VcIik7XG4gIGNvbnN0IGNyeXN0YWxsaXplID0gcmVxdWlyZShcIi4uLy4uL2NyeXN0YWxsaXplXCIpO1xuXG4gIGNvbnN0IHsgZ2V0Q2xpZW50IH0gPSByZXF1aXJlKFwiLi91dGlsc1wiKTtcblxuICBjb25zdCB7IGJhc2tldE1vZGVsLCBjdXN0b21lciwgY29uZmlybWF0aW9uVVJMIH0gPSBjaGVja291dE1vZGVsO1xuICBjb25zdCB7IHNlcnZpY2VDYWxsYmFja0hvc3QsIHVzZXIgfSA9IGNvbnRleHQ7XG5cbiAgLy8gQWRkIHRoZSBpZGVudGlmaWVyIGZyb20gdGhlIGN1cnJlbnQgbG9nZ2VkIGluIHVzZXJcbiAgY29uc3QgY3VzdG9tZXJXaXRoQ3VycmVudExvZ2dlZEluVXNlciA9IHtcbiAgICAuLi5jdXN0b21lcixcbiAgICBpZGVudGlmaWVyOiB1c2VyLmVtYWlsLFxuICB9O1xuXG4gIGNvbnN0IGJhc2tldCA9IGF3YWl0IGJhc2tldFNlcnZpY2UuZ2V0KHsgYmFza2V0TW9kZWwsIGNvbnRleHQgfSk7XG4gIGNvbnN0IHsgdG90YWwgfSA9IGJhc2tldDtcblxuICBsZXQgeyBjcnlzdGFsbGl6ZU9yZGVySWQgfSA9IGJhc2tldE1vZGVsO1xuXG4gIGNvbnN0IGlzU3Vic2NyaXB0aW9uID0gZmFsc2U7XG5cbiAgLyogVXNlIGEgQ3J5c3RhbGxpemUgb3JkZXIgYW5kIHRoZSBmdWxmaWxtZW50IHBpcGVsaW5lcyB0b1xuICAgKiBtYW5hZ2UgdGhlIGxpZmVjeWNsZSBvZiB0aGUgb3JkZXJcbiAgICovXG4gIGlmIChjcnlzdGFsbGl6ZU9yZGVySWQpIHtcbiAgICBhd2FpdCBjcnlzdGFsbGl6ZS5vcmRlcnMudXBkYXRlKGNyeXN0YWxsaXplT3JkZXJJZCwge1xuICAgICAgLi4uYmFza2V0LFxuICAgICAgY3VzdG9tZXI6IGN1c3RvbWVyV2l0aEN1cnJlbnRMb2dnZWRJblVzZXIsXG4gICAgICBtZXRhOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBrZXk6IFwiaXNTdWJzY3JpcHRpb25cIixcbiAgICAgICAgICB2YWx1ZTogaXNTdWJzY3JpcHRpb24gPyBcInllc1wiIDogXCJub1wiLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBjcnlzdGFsbGl6ZU9yZGVyID0gYXdhaXQgY3J5c3RhbGxpemUub3JkZXJzLmNyZWF0ZSh7XG4gICAgICAuLi5iYXNrZXQsXG4gICAgICBjdXN0b21lcjogY3VzdG9tZXJXaXRoQ3VycmVudExvZ2dlZEluVXNlcixcbiAgICAgIG1ldGE6IFtcbiAgICAgICAge1xuICAgICAgICAgIGtleTogXCJpc1N1YnNjcmlwdGlvblwiLFxuICAgICAgICAgIHZhbHVlOiBpc1N1YnNjcmlwdGlvbiA/IFwieWVzXCIgOiBcIm5vXCIsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0pO1xuICAgIGNyeXN0YWxsaXplT3JkZXJJZCA9IGNyeXN0YWxsaXplT3JkZXIuaWQ7XG4gIH1cblxuICBjb25zdCBtb2xsaWVDbGllbnQgPSBhd2FpdCBnZXRDbGllbnQoKTtcblxuICBjb25zdCBtb2xsaWVDdXN0b21lciA9IGF3YWl0IG1vbGxpZUNsaWVudC5jdXN0b21lcnMuY3JlYXRlKHtcbiAgICBuYW1lOiBgJHtjdXN0b21lci5maXJzdE5hbWV9ICR7Y3VzdG9tZXIubGFzdE5hbWV9YC50cmltKCkgfHwgXCJKYW5lIERvZVwiLFxuICAgIGVtYWlsOiBjdXN0b21lci5hZGRyZXNzZXNbMF0uZW1haWwsXG4gIH0pO1xuXG4gIGNvbnN0IGNvbmZpcm1hdGlvbiA9IG5ldyBVUkwoXG4gICAgY29uZmlybWF0aW9uVVJMLnJlcGxhY2UoXCJ7Y3J5c3RhbGxpemVPcmRlcklkfVwiLCBjcnlzdGFsbGl6ZU9yZGVySWQpXG4gICk7XG5cbiAgY29uc3QgdmFsaWRNb2xsaWVPcmRlciA9IHtcbiAgICBhbW91bnQ6IHtcbiAgICAgIGN1cnJlbmN5OlxuICAgICAgICBwcm9jZXNzLmVudi5NT0xMSUVfREVGQVVMVF9DVVJSRU5DWSB8fCB0b3RhbC5jdXJyZW5jeS50b1VwcGVyQ2FzZSgpLFxuICAgICAgdmFsdWU6IHRvdGFsLmdyb3NzLnRvRml4ZWQoMiksXG4gICAgfSxcbiAgICBjdXN0b21lcklkOiBtb2xsaWVDdXN0b21lci5pZCxcbiAgICBzZXF1ZW5jZVR5cGU6IFwiZmlyc3RcIixcbiAgICBkZXNjcmlwdGlvbjogXCJNb2xsaWUgdGVzdCB0cmFuc2FjdGlvblwiLFxuICAgIHJlZGlyZWN0VXJsOiBjb25maXJtYXRpb24udG9TdHJpbmcoKSxcbiAgICB3ZWJob29rVXJsOiBgJHtzZXJ2aWNlQ2FsbGJhY2tIb3N0fS93ZWJob29rcy9wYXltZW50LXByb3ZpZGVycy9tb2xsaWUvb3JkZXItdXBkYXRlYCxcbiAgICBtZXRhZGF0YTogeyBjcnlzdGFsbGl6ZU9yZGVySWQgfSxcbiAgfTtcblxuICBjb25zdCBtb2xsaWVPcmRlclJlc3BvbnNlID0gYXdhaXQgbW9sbGllQ2xpZW50LnBheW1lbnRzLmNyZWF0ZShcbiAgICB2YWxpZE1vbGxpZU9yZGVyXG4gICk7XG5cbiAgaWYgKGlzU3Vic2NyaXB0aW9uKSB7XG4gICAgYXdhaXQgbW9sbGllQ2xpZW50LmN1c3RvbWVyc19tYW5kYXRlcy5nZXQobW9sbGllT3JkZXJSZXNwb25zZS5tYW5kYXRlSWQsIHtcbiAgICAgIGN1c3RvbWVySWQ6IG1vbGxpZUN1c3RvbWVyLmlkLFxuICAgIH0pO1xuXG4gICAgLy8gRGVmaW5lIHRoZSBzdGFydCBkYXRlIGZvciB0aGUgc3Vic2NyaXB0aW9uXG4gICAgY29uc3Qgc3RhcnREYXRlID0gbmV3IERhdGUoKTtcbiAgICBzdGFydERhdGUuc2V0RGF0ZShzdGFydERhdGUuZ2V0RGF0ZSgpICsgMTUpO1xuICAgIHN0YXJ0RGF0ZS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcblxuICAgIGF3YWl0IG1vbGxpZUNsaWVudC5jdXN0b21lcnNfc3Vic2NyaXB0aW9ucy5jcmVhdGUoe1xuICAgICAgY3VzdG9tZXJJZDogbW9sbGllQ3VzdG9tZXIuaWQsXG4gICAgICBhbW91bnQ6IHZhbGlkTW9sbGllT3JkZXIuYW1vdW50LFxuICAgICAgdGltZXM6IDEsXG4gICAgICBpbnRlcnZhbDogXCIxIG1vbnRoXCIsXG4gICAgICBzdGFydERhdGUsXG4gICAgICBkZXNjcmlwdGlvbjogXCJNb2xsaWUgVGVzdCBzdWJzY3JpcHRpb25cIixcbiAgICAgIHdlYmhvb2tVcmw6IGAke3NlcnZpY2VDYWxsYmFja0hvc3R9L3dlYmhvb2tzL3BheW1lbnQtcHJvdmlkZXJzL21vbGxpZS9zdWJzY3JpcHRpb24tcmVuZXdhbGAsXG4gICAgICBtZXRhZGF0YToge30sXG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgY2hlY2tvdXRMaW5rOiBtb2xsaWVPcmRlclJlc3BvbnNlLl9saW5rcy5jaGVja291dC5ocmVmLFxuICAgIGNyeXN0YWxsaXplT3JkZXJJZCxcbiAgfTtcbn07XG4iLCJjb25zdCB7IGdldENsaWVudCB9ID0gcmVxdWlyZShcIi4vdXRpbHNcIik7XG5jb25zdCB0b0NyeXN0YWxsaXplT3JkZXJNb2RlbCA9IHJlcXVpcmUoXCIuL3RvLWNyeXN0YWxsaXplLW9yZGVyLW1vZGVsXCIpO1xuY29uc3QgY3JlYXRlUGF5bWVudCA9IHJlcXVpcmUoXCIuL2NyZWF0ZS1wYXltZW50XCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZW5hYmxlZDogQm9vbGVhbihwcm9jZXNzLmVudi5NT0xMSUVfQVBJX0tFWSksXG4gIGZyb250ZW5kQ29uZmlnOiB7fSxcbiAgZ2V0Q2xpZW50LFxuICB0b0NyeXN0YWxsaXplT3JkZXJNb2RlbCxcbiAgY3JlYXRlUGF5bWVudCxcbn07XG4iLCIvKipcbiAqIFRPRE86IHJldmlldyB3aGF0IGhhcHBlbnMgdG8gdGhlIEdlbmVyYWwgT3JkZXIgVmF0IEdyb3VwIG9uIG11bHRpcGxlIHRheCBncm91cHNcbiAqIG9uIG9yZGVyIChtdWx0LiBpdGVtcyBoYXZpbmcgZGlmZiB2YXRUeXBlcywgaXMgaXQgYSB0aGluZz8pXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBtb2xsaWVUb0NyeXN0YWxsaXplT3JkZXJNb2RlbCh7XG4gIG1vbGxpZU9yZGVyLFxuICBtb2xsaWVDdXN0b21lcixcbn0pIHtcbiAgY29uc3QgY3VzdG9tZXJOYW1lID0gbW9sbGllQ3VzdG9tZXIubmFtZS5zcGxpdChcIiBcIik7XG5cbiAgcmV0dXJuIHtcbiAgICBjdXN0b21lcjoge1xuICAgICAgaWRlbnRpZmllcjogbW9sbGllQ3VzdG9tZXIuZW1haWwsXG4gICAgICBmaXJzdE5hbWU6IGN1c3RvbWVyTmFtZVswXSxcbiAgICAgIG1pZGRsZU5hbWU6IGN1c3RvbWVyTmFtZS5zbGljZSgxLCBjdXN0b21lck5hbWUubGVuZ3RoIC0gMSkuam9pbigpLFxuICAgICAgbGFzdE5hbWU6IGN1c3RvbWVyTmFtZVtjdXN0b21lck5hbWUubGVuZ3RoIC0gMV0sXG4gICAgICBiaXJ0aERhdGU6IERhdGUsXG4gICAgICBhZGRyZXNzZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIHR5cGU6IFwiYmlsbGluZ1wiLFxuICAgICAgICAgIGZpcnN0TmFtZTogY3VzdG9tZXJOYW1lWzBdLFxuICAgICAgICAgIG1pZGRsZU5hbWU6IGN1c3RvbWVyTmFtZS5zbGljZSgxLCBjdXN0b21lck5hbWUubGVuZ3RoIC0gMSkuam9pbigpLFxuICAgICAgICAgIGxhc3ROYW1lOiBjdXN0b21lck5hbWVbY3VzdG9tZXJOYW1lLmxlbmd0aCAtIDFdLFxuICAgICAgICAgIHN0cmVldDogXCJUZXN0IGxpbmUxXCIsXG4gICAgICAgICAgc3RyZWV0MjogXCJUZXN0IGxpbmUyXCIsXG4gICAgICAgICAgcG9zdGFsQ29kZTogXCJUZXN0IHBvc3RhbF9jb2RlXCIsXG4gICAgICAgICAgY2l0eTogXCJUZXN0IGNpdHlcIixcbiAgICAgICAgICBzdGF0ZTogXCJUZXN0IHN0YXRlXCIsXG4gICAgICAgICAgY291bnRyeTogXCJUZXN0IGNvdW50cnlcIixcbiAgICAgICAgICBwaG9uZTogXCJUZXN0IFBob25lXCIsXG4gICAgICAgICAgZW1haWw6IG1vbGxpZUN1c3RvbWVyLmVtYWlsLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgdHlwZTogXCJkZWxpdmVyeVwiLFxuICAgICAgICAgIGZpcnN0TmFtZTogY3VzdG9tZXJOYW1lWzBdLFxuICAgICAgICAgIG1pZGRsZU5hbWU6IGN1c3RvbWVyTmFtZS5zbGljZSgxLCBjdXN0b21lck5hbWUubGVuZ3RoIC0gMSkuam9pbigpLFxuICAgICAgICAgIGxhc3ROYW1lOiBjdXN0b21lck5hbWVbY3VzdG9tZXJOYW1lLmxlbmd0aCAtIDFdLFxuICAgICAgICAgIHN0cmVldDogXCJUZXN0IGxpbmUxXCIsXG4gICAgICAgICAgc3RyZWV0MjogXCJUZXN0IGxpbmUyXCIsXG4gICAgICAgICAgcG9zdGFsQ29kZTogXCJUZXN0IHBvc3RhbF9jb2RlXCIsXG4gICAgICAgICAgY2l0eTogXCJUZXN0IGNpdHlcIixcbiAgICAgICAgICBzdGF0ZTogXCJUZXN0IHN0YXRlXCIsXG4gICAgICAgICAgY291bnRyeTogXCJUZXN0IGNvdW50cnlcIixcbiAgICAgICAgICBwaG9uZTogXCJUZXN0IFBob25lXCIsXG4gICAgICAgICAgZW1haWw6IG1vbGxpZUN1c3RvbWVyLmVtYWlsLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9LFxuICAgIHBheW1lbnQ6IFtcbiAgICAgIHtcbiAgICAgICAgcHJvdmlkZXI6IFwiY3VzdG9tXCIsXG4gICAgICAgIGN1c3RvbToge1xuICAgICAgICAgIHByb3BlcnRpZXM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgcHJvcGVydHk6IFwicmVzb3VyY2VcIixcbiAgICAgICAgICAgICAgdmFsdWU6IG1vbGxpZU9yZGVyLnJlc291cmNlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgcHJvcGVydHk6IFwicmVzb3VyY2VfaWRcIixcbiAgICAgICAgICAgICAgdmFsdWU6IG1vbGxpZU9yZGVyLmlkLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgcHJvcGVydHk6IFwibW9kZVwiLFxuICAgICAgICAgICAgICB2YWx1ZTogbW9sbGllT3JkZXIubW9kZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHByb3BlcnR5OiBcIm1ldGhvZFwiLFxuICAgICAgICAgICAgICB2YWx1ZTogbW9sbGllT3JkZXIubWV0aG9kLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgcHJvcGVydHk6IFwic3RhdHVzXCIsXG4gICAgICAgICAgICAgIHZhbHVlOiBtb2xsaWVPcmRlci5zdGF0dXMsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBwcm9wZXJ0eTogXCJwcm9maWxlSWRcIixcbiAgICAgICAgICAgICAgdmFsdWU6IG1vbGxpZU9yZGVyLnByb2ZpbGVJZCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHByb3BlcnR5OiBcIm1hbmRhdGVJZFwiLFxuICAgICAgICAgICAgICB2YWx1ZTogbW9sbGllT3JkZXIubWFuZGF0ZUlkLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgcHJvcGVydHk6IFwiY3VzdG9tZXJJZFwiLFxuICAgICAgICAgICAgICB2YWx1ZTogbW9sbGllT3JkZXIuY3VzdG9tZXJJZCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHByb3BlcnR5OiBcInNlcXVlbmNlVHlwZVwiLFxuICAgICAgICAgICAgICB2YWx1ZTogbW9sbGllT3JkZXIuc2VxdWVuY2VUeXBlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICBdLFxuICB9O1xufTtcbiIsImNvbnN0IGludmFyaWFudCA9IHJlcXVpcmUoXCJpbnZhcmlhbnRcIik7XG5cbmNvbnN0IE1PTExJRV9BUElfS0VZID0gcHJvY2Vzcy5lbnYuTU9MTElFX0FQSV9LRVk7XG5cbmxldCBjbGllbnQ7XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZ2V0Q2xpZW50OiAoKSA9PiB7XG4gICAgaW52YXJpYW50KE1PTExJRV9BUElfS0VZLCBcInByb2Nlc3MuZW52Lk1PTExJRV9BUElfS0VZIGlzIG5vdCBkZWZpbmVkXCIpO1xuXG4gICAgaWYgKCFjbGllbnQpIHtcbiAgICAgIGNvbnN0IHsgY3JlYXRlTW9sbGllQ2xpZW50IH0gPSByZXF1aXJlKFwiQG1vbGxpZS9hcGktY2xpZW50XCIpO1xuICAgICAgY2xpZW50ID0gY3JlYXRlTW9sbGllQ2xpZW50KHsgYXBpS2V5OiBwcm9jZXNzLmVudi5NT0xMSUVfQVBJX0tFWSB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gY2xpZW50O1xuICB9LFxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gYXN5bmMgZnVuY3Rpb24gY29uZmlybU9yZGVyKHtcbiAgcGF5bWVudEludGVudElkLFxuICBjaGVja291dE1vZGVsLFxuICBjb250ZXh0LFxufSkge1xuICBjb25zdCBjcnlzdGFsbGl6ZSA9IHJlcXVpcmUoXCIuLi8uLi9jcnlzdGFsbGl6ZVwiKTtcbiAgY29uc3QgYmFza2V0U2VydmljZSA9IHJlcXVpcmUoXCIuLi8uLi9iYXNrZXQtc2VydmljZVwiKTtcblxuICBjb25zdCB0b0NyeXN0YWxsaXplT3JkZXJNb2RlbCA9IHJlcXVpcmUoXCIuL3RvLWNyeXN0YWxsaXplLW9yZGVyLW1vZGVsXCIpO1xuXG4gIGNvbnN0IHsgYmFza2V0TW9kZWwgfSA9IGNoZWNrb3V0TW9kZWw7XG4gIGNvbnN0IHsgdXNlciB9ID0gY29udGV4dDtcblxuICBjb25zdCBiYXNrZXQgPSBhd2FpdCBiYXNrZXRTZXJ2aWNlLmdldCh7IGJhc2tldE1vZGVsLCBjb250ZXh0IH0pO1xuXG4gIC8vIFByZXBhcmUgYSB2YWxpZCBtb2RlbCBmb3IgQ3J5c3RhbGxpemUgb3JkZXIgaW50YWtlXG4gIGNvbnN0IGNyeXN0YWxsaXplT3JkZXJNb2RlbCA9IGF3YWl0IHRvQ3J5c3RhbGxpemVPcmRlck1vZGVsKHtcbiAgICBiYXNrZXQsXG4gICAgY2hlY2tvdXRNb2RlbCxcbiAgICBwYXltZW50SW50ZW50SWQsXG4gICAgY3VzdG9tZXJJZGVudGlmaWVyOlxuICAgICAgdXNlcj8uZW1haWwgfHwgY2hlY2tvdXRNb2RlbD8uY3VzdG9tZXI/LmFkZHJlc3Nlcz8uWzBdPy5lbWFpbCB8fCBcIlwiLFxuICB9KTtcblxuICAvKipcbiAgICogUmVjb3JkIHRoZSBvcmRlciBpbiBDcnlzdGFsbGl6ZVxuICAgKiBNYW5hZ2UgdGhlIG9yZGVyIGxpZmVjeWNsZSBieSB1c2luZyB0aGUgZnVsZmlsbWVudCBwaXBlbGluZXM6XG4gICAqIGh0dHBzOi8vY3J5c3RhbGxpemUuY29tL2xlYXJuL3VzZXItZ3VpZGVzL29yZGVycy1hbmQtZnVsZmlsbWVudFxuICAgKi9cbiAgY29uc3Qgb3JkZXIgPSBhd2FpdCBjcnlzdGFsbGl6ZS5vcmRlcnMuY3JlYXRlKGNyeXN0YWxsaXplT3JkZXJNb2RlbCk7XG5cbiAgcmV0dXJuIHtcbiAgICBzdWNjZXNzOiB0cnVlLFxuICAgIG9yZGVySWQ6IG9yZGVyLmlkLFxuICB9O1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gYXN5bmMgZnVuY3Rpb24gY3JlYXRlUGF5bWVudEludGVudCh7XG4gIGNoZWNrb3V0TW9kZWwsXG4gIGNvbmZpcm0gPSBmYWxzZSxcbiAgcGF5bWVudE1ldGhvZElkLFxuICBjb250ZXh0LFxufSkge1xuICBjb25zdCBiYXNrZXRTZXJ2aWNlID0gcmVxdWlyZShcIi4uLy4uL2Jhc2tldC1zZXJ2aWNlXCIpO1xuICBjb25zdCB7IGdldENsaWVudCB9ID0gcmVxdWlyZShcIi4vdXRpbHNcIik7XG5cbiAgY29uc3QgeyBiYXNrZXRNb2RlbCB9ID0gY2hlY2tvdXRNb2RlbDtcblxuICBjb25zdCBiYXNrZXQgPSBhd2FpdCBiYXNrZXRTZXJ2aWNlLmdldCh7IGJhc2tldE1vZGVsLCBjb250ZXh0IH0pO1xuXG4gIGNvbnN0IHBheW1lbnRJbnRlbnQgPSBhd2FpdCBnZXRDbGllbnQoKS5wYXltZW50SW50ZW50cy5jcmVhdGUoe1xuICAgIGFtb3VudDogYmFza2V0LnRvdGFsLmdyb3NzICogMTAwLFxuICAgIGN1cnJlbmN5OiBiYXNrZXQudG90YWwuY3VycmVuY3ksXG4gICAgY29uZmlybSxcbiAgICBwYXltZW50X21ldGhvZDogcGF5bWVudE1ldGhvZElkLFxuICB9KTtcblxuICByZXR1cm4gcGF5bWVudEludGVudDtcbn07XG4iLCJjb25zdCBjcmVhdGVQYXltZW50SW50ZW50ID0gcmVxdWlyZShcIi4vY3JlYXRlLXBheW1lbnQtaW50ZW50XCIpO1xuY29uc3QgY29uZmlybU9yZGVyID0gcmVxdWlyZShcIi4vY29uZmlybS1vcmRlclwiKTtcblxuY29uc3QgU1RSSVBFX1NFQ1JFVF9LRVkgPSBwcm9jZXNzLmVudi5TVFJJUEVfU0VDUkVUX0tFWTtcbmNvbnN0IFNUUklQRV9QVUJMSVNIQUJMRV9LRVkgPSBwcm9jZXNzLmVudi5TVFJJUEVfUFVCTElTSEFCTEVfS0VZO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZW5hYmxlZDogQm9vbGVhbihTVFJJUEVfU0VDUkVUX0tFWSAmJiBTVFJJUEVfUFVCTElTSEFCTEVfS0VZKSxcblxuICAvLyBUaGUgcmVxdWlyZWQgZnJvbnRlbmQgY29uZmlnXG4gIGZyb250ZW5kQ29uZmlnOiB7XG4gICAgcHVibGlzaGFibGVLZXk6IFNUUklQRV9QVUJMSVNIQUJMRV9LRVksXG4gIH0sXG4gIGNyZWF0ZVBheW1lbnRJbnRlbnQsXG4gIGNvbmZpcm1PcmRlcixcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGFzeW5jIGZ1bmN0aW9uIHN0cmlwZVRvQ3J5c3RhbGxpemVPcmRlck1vZGVsKHtcbiAgYmFza2V0LFxuICBjaGVja291dE1vZGVsLFxuICBwYXltZW50SW50ZW50SWQsXG4gIGN1c3RvbWVySWRlbnRpZmllcixcbn0pIHtcbiAgY29uc3QgeyBnZXRDbGllbnQgfSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpO1xuXG4gIGNvbnN0IHBheW1lbnRJbnRlbnQgPSBhd2FpdCBnZXRDbGllbnQoKS5wYXltZW50SW50ZW50cy5yZXRyaWV2ZShcbiAgICBwYXltZW50SW50ZW50SWRcbiAgKTtcblxuICBjb25zdCB7IGRhdGEgfSA9IHBheW1lbnRJbnRlbnQuY2hhcmdlcztcbiAgY29uc3QgY2hhcmdlID0gZGF0YVswXTtcblxuICBjb25zdCBjdXN0b21lck5hbWUgPSBjaGFyZ2UuYmlsbGluZ19kZXRhaWxzLm5hbWUuc3BsaXQoXCIgXCIpO1xuICBsZXQgZW1haWwgPSBjaGFyZ2UucmVjZWlwdF9lbWFpbDtcbiAgaWYgKCFlbWFpbCAmJiBjaGVja291dE1vZGVsLmN1c3RvbWVyICYmIGNoZWNrb3V0TW9kZWwuY3VzdG9tZXIuYWRkcmVzc2VzKSB7XG4gICAgY29uc3QgYWRkcmVzc1dpdGhFbWFpbCA9IGNoZWNrb3V0TW9kZWwuY3VzdG9tZXIuYWRkcmVzc2VzLmZpbmQoXG4gICAgICAoYSkgPT4gISFhLmVtYWlsXG4gICAgKTtcbiAgICBpZiAoYWRkcmVzc1dpdGhFbWFpbCkge1xuICAgICAgZW1haWwgPSBhZGRyZXNzV2l0aEVtYWlsLmVtYWlsO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IG1ldGEgPSBbXTtcbiAgaWYgKHBheW1lbnRJbnRlbnQubWVyY2hhbnRfZGF0YSkge1xuICAgIG1ldGEucHVzaCh7XG4gICAgICBrZXk6IFwic3RyaXBlTWVyY2hhbnREYXRhXCIsXG4gICAgICB2YWx1ZTogSlNPTi5zdHJpbmdpZnkocGF5bWVudEludGVudC5tZXJjaGFudF9kYXRhKSxcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgY2FydDogYmFza2V0LmNhcnQsXG4gICAgdG90YWw6IGJhc2tldC50b3RhbCxcbiAgICBtZXRhLFxuICAgIGN1c3RvbWVyOiB7XG4gICAgICBpZGVudGlmaWVyOiBjdXN0b21lcklkZW50aWZpZXIsXG4gICAgICBmaXJzdE5hbWU6IGN1c3RvbWVyTmFtZVswXSxcbiAgICAgIG1pZGRsZU5hbWU6IGN1c3RvbWVyTmFtZS5zbGljZSgxLCBjdXN0b21lck5hbWUubGVuZ3RoIC0gMSkuam9pbigpLFxuICAgICAgbGFzdE5hbWU6IGN1c3RvbWVyTmFtZVtjdXN0b21lck5hbWUubGVuZ3RoIC0gMV0sXG4gICAgICBiaXJ0aERhdGU6IERhdGUsXG4gICAgICBhZGRyZXNzZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIHR5cGU6IFwiYmlsbGluZ1wiLFxuICAgICAgICAgIGZpcnN0TmFtZTogY3VzdG9tZXJOYW1lWzBdLFxuICAgICAgICAgIG1pZGRsZU5hbWU6IGN1c3RvbWVyTmFtZS5zbGljZSgxLCBjdXN0b21lck5hbWUubGVuZ3RoIC0gMSkuam9pbigpLFxuICAgICAgICAgIGxhc3ROYW1lOiBjdXN0b21lck5hbWVbY3VzdG9tZXJOYW1lLmxlbmd0aCAtIDFdLFxuICAgICAgICAgIHN0cmVldDogY2hhcmdlLmJpbGxpbmdfZGV0YWlscy5hZGRyZXNzLmxpbmUxLFxuICAgICAgICAgIHN0cmVldDI6IGNoYXJnZS5iaWxsaW5nX2RldGFpbHMuYWRkcmVzcy5saW5lMixcbiAgICAgICAgICBwb3N0YWxDb2RlOiBjaGFyZ2UuYmlsbGluZ19kZXRhaWxzLmFkZHJlc3MucG9zdGFsX2NvZGUsXG4gICAgICAgICAgY2l0eTogY2hhcmdlLmJpbGxpbmdfZGV0YWlscy5hZGRyZXNzLmNpdHksXG4gICAgICAgICAgc3RhdGU6IGNoYXJnZS5iaWxsaW5nX2RldGFpbHMuYWRkcmVzcy5zdGF0ZSxcbiAgICAgICAgICBjb3VudHJ5OiBjaGFyZ2UuYmlsbGluZ19kZXRhaWxzLmFkZHJlc3MuY291bnRyeSxcbiAgICAgICAgICBwaG9uZTogY2hhcmdlLmJpbGxpbmdfZGV0YWlscy5waG9uZSxcbiAgICAgICAgICBlbWFpbCxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHR5cGU6IFwiZGVsaXZlcnlcIixcbiAgICAgICAgICBmaXJzdE5hbWU6IGN1c3RvbWVyTmFtZVswXSxcbiAgICAgICAgICBtaWRkbGVOYW1lOiBjdXN0b21lck5hbWUuc2xpY2UoMSwgY3VzdG9tZXJOYW1lLmxlbmd0aCAtIDEpLmpvaW4oKSxcbiAgICAgICAgICBsYXN0TmFtZTogY3VzdG9tZXJOYW1lW2N1c3RvbWVyTmFtZS5sZW5ndGggLSAxXSxcbiAgICAgICAgICBzdHJlZXQ6IGNoYXJnZS5iaWxsaW5nX2RldGFpbHMuYWRkcmVzcy5saW5lMSxcbiAgICAgICAgICBzdHJlZXQyOiBjaGFyZ2UuYmlsbGluZ19kZXRhaWxzLmFkZHJlc3MubGluZTIsXG4gICAgICAgICAgcG9zdGFsQ29kZTogY2hhcmdlLmJpbGxpbmdfZGV0YWlscy5hZGRyZXNzLnBvc3RhbF9jb2RlLFxuICAgICAgICAgIGNpdHk6IGNoYXJnZS5iaWxsaW5nX2RldGFpbHMuYWRkcmVzcy5jaXR5LFxuICAgICAgICAgIHN0YXRlOiBjaGFyZ2UuYmlsbGluZ19kZXRhaWxzLmFkZHJlc3Muc3RhdGUsXG4gICAgICAgICAgY291bnRyeTogY2hhcmdlLmJpbGxpbmdfZGV0YWlscy5hZGRyZXNzLmNvdW50cnksXG4gICAgICAgICAgcGhvbmU6IGNoYXJnZS5iaWxsaW5nX2RldGFpbHMucGhvbmUsXG4gICAgICAgICAgZW1haWwsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0sXG4gICAgcGF5bWVudDogW1xuICAgICAge1xuICAgICAgICBwcm92aWRlcjogXCJzdHJpcGVcIixcbiAgICAgICAgc3RyaXBlOiB7XG4gICAgICAgICAgc3RyaXBlOiBjaGFyZ2UuaWQsXG4gICAgICAgICAgY3VzdG9tZXJJZDogY2hhcmdlLmN1c3RvbWVyLFxuICAgICAgICAgIG9yZGVySWQ6IGNoYXJnZS5wYXltZW50X2ludGVudCxcbiAgICAgICAgICBwYXltZW50TWV0aG9kOiBjaGFyZ2UucGF5bWVudF9tZXRob2RfZGV0YWlscy50eXBlLFxuICAgICAgICAgIHBheW1lbnRNZXRob2RJZDogY2hhcmdlLnBheW1lbnRfbWV0aG9kLFxuICAgICAgICAgIHBheW1lbnRJbnRlbnRJZDogY2hhcmdlLnBheW1lbnRfaW50ZW50LFxuICAgICAgICAgIHN1YnNjcmlwdGlvbklkOiBjaGFyZ2Uuc3Vic2NyaXB0aW9uLFxuICAgICAgICAgIG1ldGFkYXRhOiBcIlwiLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICBdLFxuICB9O1xufTtcbiIsImNvbnN0IGludmFyaWFudCA9IHJlcXVpcmUoXCJpbnZhcmlhbnRcIik7XG5cbmNvbnN0IFNUUklQRV9TRUNSRVRfS0VZID0gcHJvY2Vzcy5lbnYuU1RSSVBFX1NFQ1JFVF9LRVk7XG5cbmxldCBjbGllbnQ7XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZ2V0Q2xpZW50OiAoKSA9PiB7XG4gICAgaW52YXJpYW50KFxuICAgICAgU1RSSVBFX1NFQ1JFVF9LRVksXG4gICAgICBcInByb2Nlc3MuZW52LlNUUklQRV9TRUNSRVRfS0VZIGlzIG5vdCBkZWZpbmVkXCJcbiAgICApO1xuXG4gICAgaWYgKCFjbGllbnQpIHtcbiAgICAgIGNvbnN0IHN0cmlwZVNkayA9IHJlcXVpcmUoXCJzdHJpcGVcIik7XG4gICAgICBjbGllbnQgPSBzdHJpcGVTZGsoU1RSSVBFX1NFQ1JFVF9LRVkpO1xuICAgIH1cblxuICAgIHJldHVybiBjbGllbnQ7XG4gIH0sXG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBhc3luYyBmdW5jdGlvbiB2aXBwc0ZhbGxiYWNrKHtcbiAgY3J5c3RhbGxpemVPcmRlcklkLFxuICBvblN1Y2Nlc3NVUkwsXG4gIG9uRXJyb3JVUkwsXG59KSB7XG4gIGNvbnN0IGNyeXN0YWxsaXplID0gcmVxdWlyZShcIi4uLy4uL2NyeXN0YWxsaXplXCIpO1xuXG4gIGNvbnN0IHsgZ2V0Q2xpZW50IH0gPSByZXF1aXJlKFwiLi91dGlsc1wiKTtcblxuICBsZXQgcmVkaXJlY3RUbyA9IFwiXCI7XG5cbiAgY29uc3QgdmlwcHNDbGllbnQgPSBhd2FpdCBnZXRDbGllbnQoKTtcblxuICAvLyBSZXRyaWV2ZSB0aGUgVmlwcHMgb3JkZXIgdG8gZ2V0IHRyYW5zYWN0aW9uIGRldGFpbHNcbiAgY29uc3Qgb3JkZXIgPSBhd2FpdCB2aXBwc0NsaWVudC5nZXRPcmRlckRldGFpbHMoe1xuICAgIG9yZGVySWQ6IGNyeXN0YWxsaXplT3JkZXJJZCxcbiAgfSk7XG4gIGNvbnN0IFtsYXN0VHJhbnNhY3Rpb25Mb2dFbnRyeV0gPSBvcmRlci50cmFuc2FjdGlvbkxvZ0hpc3Rvcnkuc29ydChcbiAgICAoYSwgYikgPT4gbmV3IERhdGUoYi50aW1lU3RhbXApIC0gbmV3IERhdGUoYS50aW1lU3RhbXApXG4gICk7XG5cbiAgLyoqXG4gICAqIElmIHRoZSB0cmFuc2FjdGlvbiBsb2dzIGxhc3QgZW50cnkgaGFzIHN0YXR1c1xuICAgKiBSRVNFUlZFLCB0aGVuIHRoZSBhbW91bnQgaGFzIGJlZW4gc3VjY2Vzc2Z1bGx5XG4gICAqIHJlc2VydmVkIG9uIHRoZSB1c2VyIGFjY291bnQsIGFuZCB3ZSBjYW4gc2hvd1xuICAgKiB0aGUgY29uZmlybWF0aW9uIHBhZ2VcbiAgICovXG4gIGlmIChcbiAgICBsYXN0VHJhbnNhY3Rpb25Mb2dFbnRyeS5vcGVyYXRpb24gPT09IFwiUkVTRVJWRVwiICYmXG4gICAgbGFzdFRyYW5zYWN0aW9uTG9nRW50cnkub3BlcmF0aW9uU3VjY2Vzc1xuICApIHtcbiAgICByZWRpcmVjdFRvID0gb25TdWNjZXNzVVJMO1xuXG4gICAgLyoqXG4gICAgICogQXQgdGhpcyBwb2ludCB3ZSBoYXZlIHVzZXIgZGV0YWlscyBmcm9tIFZpcHBzLCB3aGljaFxuICAgICAqIG1ha2VzIGl0IGEgZ29vZCB0aW1lIHRvIHVwZGF0ZSB0aGUgQ3J5c3RhbGxpemUgb3JkZXJcbiAgICAgKi9cbiAgICBjb25zdCB7XG4gICAgICB1c2VyRGV0YWlsczoge1xuICAgICAgICB1c2VySWQsXG4gICAgICAgIGZpcnN0TmFtZSxcbiAgICAgICAgbGFzdE5hbWUsXG4gICAgICAgIGVtYWlsLFxuICAgICAgICBtb2JpbGVOdW1iZXI6IHBob25lLFxuICAgICAgfSA9IHt9LFxuICAgICAgc2hpcHBpbmdEZXRhaWxzOiB7XG4gICAgICAgIGFkZHJlc3M6IHtcbiAgICAgICAgICBhZGRyZXNzTGluZTE6IHN0cmVldCxcbiAgICAgICAgICBhZGRyZXNzTGluZTI6IHN0cmVldDIsXG4gICAgICAgICAgcG9zdENvZGU6IHBvc3RhbENvZGUsXG4gICAgICAgICAgY2l0eSxcbiAgICAgICAgICBjb3VudHJ5LFxuICAgICAgICB9ID0ge30sXG4gICAgICB9ID0ge30sXG4gICAgfSA9IG9yZGVyO1xuXG4gICAgYXdhaXQgY3J5c3RhbGxpemUub3JkZXJzLnVwZGF0ZShjcnlzdGFsbGl6ZU9yZGVySWQsIHtcbiAgICAgIHBheW1lbnQ6IFtcbiAgICAgICAge1xuICAgICAgICAgIHByb3ZpZGVyOiBcImN1c3RvbVwiLFxuICAgICAgICAgIGN1c3RvbToge1xuICAgICAgICAgICAgcHJvcGVydGllczogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcHJvcGVydHk6IFwiUGF5bWVudFByb3ZpZGVyXCIsXG4gICAgICAgICAgICAgICAgdmFsdWU6IFwiVmlwcHNcIixcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHByb3BlcnR5OiBcIlZpcHBzIG9yZGVySWRcIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogY3J5c3RhbGxpemVPcmRlcklkLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcHJvcGVydHk6IFwiVmlwcHMgdXNlcklkXCIsXG4gICAgICAgICAgICAgICAgdmFsdWU6IHVzZXJJZCxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgICBjdXN0b21lcjoge1xuICAgICAgICBpZGVudGlmaWVyOiBlbWFpbCxcbiAgICAgICAgZmlyc3ROYW1lLFxuICAgICAgICBsYXN0TmFtZSxcbiAgICAgICAgYWRkcmVzc2VzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgdHlwZTogXCJkZWxpdmVyeVwiLFxuICAgICAgICAgICAgZW1haWwsXG4gICAgICAgICAgICBmaXJzdE5hbWUsXG4gICAgICAgICAgICBsYXN0TmFtZSxcbiAgICAgICAgICAgIHBob25lLFxuICAgICAgICAgICAgc3RyZWV0LFxuICAgICAgICAgICAgc3RyZWV0MixcbiAgICAgICAgICAgIHBvc3RhbENvZGUsXG4gICAgICAgICAgICBjaXR5LFxuICAgICAgICAgICAgY291bnRyeSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfSxcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICByZWRpcmVjdFRvID0gb25FcnJvclVSTDtcbiAgICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShsYXN0VHJhbnNhY3Rpb25Mb2dFbnRyeSwgbnVsbCwgMikpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICByZWRpcmVjdFRvLFxuICB9O1xufTtcbiIsIi8qKlxuICogVmlwcHMgKGh0dHBzOi8vdmlwcHMubm8pXG4gKlxuICogR2V0dGluZyBzdGFydGVkOlxuICogaHR0cHM6Ly9jcnlzdGFsbGl6ZS5jb20vbGVhcm4vb3Blbi1zb3VyY2UvcGF5bWVudC1nYXRld2F5cy92aXBwc1xuICovXG5cbmNvbnN0IFZJUFBTX0NMSUVOVF9JRCA9IHByb2Nlc3MuZW52LlZJUFBTX0NMSUVOVF9JRDtcbmNvbnN0IFZJUFBTX0NMSUVOVF9TRUNSRVQgPSBwcm9jZXNzLmVudi5WSVBQU19DTElFTlRfU0VDUkVUO1xuY29uc3QgVklQUFNfTUVSQ0hBTlRfU0VSSUFMID0gcHJvY2Vzcy5lbnYuVklQUFNfTUVSQ0hBTlRfU0VSSUFMO1xuY29uc3QgVklQUFNfU1VCX0tFWSA9IHByb2Nlc3MuZW52LlZJUFBTX1NVQl9LRVk7XG5cbmNvbnN0IGluaXRpYXRlUGF5bWVudCA9IHJlcXVpcmUoXCIuL2luaXRpYXRlLXBheW1lbnRcIik7XG5jb25zdCBmYWxsYmFjayA9IHJlcXVpcmUoXCIuL2ZhbGxiYWNrXCIpO1xuY29uc3Qgb3JkZXJVcGRhdGUgPSByZXF1aXJlKFwiLi9vcmRlci11cGRhdGVcIik7XG5jb25zdCB1c2VyQ29uc2VudFJlbW92YWwgPSByZXF1aXJlKFwiLi91c2VyLWNvbnNlbnQtcmVtb3ZhbFwiKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGVuYWJsZWQ6IEJvb2xlYW4oXG4gICAgVklQUFNfQ0xJRU5UX0lEICYmXG4gICAgICBWSVBQU19DTElFTlRfU0VDUkVUICYmXG4gICAgICBWSVBQU19NRVJDSEFOVF9TRVJJQUwgJiZcbiAgICAgIFZJUFBTX1NVQl9LRVlcbiAgKSxcbiAgZnJvbnRlbmRDb25maWc6IHt9LFxuICBpbml0aWF0ZVBheW1lbnQsXG4gIGZhbGxiYWNrLFxuICBvcmRlclVwZGF0ZSxcbiAgdXNlckNvbnNlbnRSZW1vdmFsLFxufTtcbiIsImNvbnN0IGludmFyaWFudCA9IHJlcXVpcmUoXCJpbnZhcmlhbnRcIik7XG5cbmNvbnN0IFZJUFBTX01FUkNIQU5UX1NFUklBTCA9IHByb2Nlc3MuZW52LlZJUFBTX01FUkNIQU5UX1NFUklBTDtcblxubW9kdWxlLmV4cG9ydHMgPSBhc3luYyBmdW5jdGlvbiBpbml0aWF0ZVZpcHBzUGF5bWVudCh7XG4gIGNoZWNrb3V0TW9kZWwsXG4gIGNvbnRleHQsXG59KSB7XG4gIGNvbnN0IGJhc2tldFNlcnZpY2UgPSByZXF1aXJlKFwiLi4vLi4vYmFza2V0LXNlcnZpY2VcIik7XG4gIGNvbnN0IGNyeXN0YWxsaXplID0gcmVxdWlyZShcIi4uLy4uL2NyeXN0YWxsaXplXCIpO1xuXG4gIGNvbnN0IHsgZ2V0Q2xpZW50IH0gPSByZXF1aXJlKFwiLi91dGlsc1wiKTtcblxuICBpbnZhcmlhbnQoXG4gICAgVklQUFNfTUVSQ0hBTlRfU0VSSUFMLFxuICAgIFwicHJvY2Vzcy5lbnYuVklQUFNfTUVSQ0hBTlRfU0VSSUFMIGlzIHVuZGVmaW5lZFwiXG4gICk7XG5cbiAgY29uc3QgeyBiYXNrZXRNb2RlbCwgY3VzdG9tZXIsIGNvbmZpcm1hdGlvblVSTCwgY2hlY2tvdXRVUkwgfSA9IGNoZWNrb3V0TW9kZWw7XG4gIGNvbnN0IHsgc2VydmljZUNhbGxiYWNrSG9zdCwgdXNlciB9ID0gY29udGV4dDtcblxuICAvLyBBZGQgdGhlIGlkZW50aWZpZXIgZnJvbSB0aGUgY3VycmVudCBsb2dnZWQgaW4gdXNlclxuICBjb25zdCBjdXN0b21lcldpdGhDdXJyZW50TG9nZ2VkSW5Vc2VyID0ge1xuICAgIC4uLmN1c3RvbWVyLFxuICAgIGlkZW50aWZpZXI6IHVzZXIuZW1haWwsXG4gIH07XG5cbiAgY29uc3QgYmFza2V0ID0gYXdhaXQgYmFza2V0U2VydmljZS5nZXQoeyBiYXNrZXRNb2RlbCwgY29udGV4dCB9KTtcbiAgY29uc3QgeyB0b3RhbCB9ID0gYmFza2V0O1xuXG4gIC8qIFVzZSBhIENyeXN0YWxsaXplIG9yZGVyIGFuZCB0aGUgZnVsZmlsbWVudCBwaXBlbGluZXMgdG9cbiAgICogbWFuYWdlIHRoZSBsaWZlY3ljbGUgb2YgdGhlIG9yZGVyXG4gICAqL1xuICBjb25zdCBjcnlzdGFsbGl6ZU9yZGVyID0gYXdhaXQgY3J5c3RhbGxpemUub3JkZXJzLmNyZWF0ZSh7XG4gICAgLi4uYmFza2V0LFxuICAgIGN1c3RvbWVyOiBjdXN0b21lcldpdGhDdXJyZW50TG9nZ2VkSW5Vc2VyLFxuICB9KTtcbiAgY29uc3QgY3J5c3RhbGxpemVPcmRlcklkID0gY3J5c3RhbGxpemVPcmRlci5pZDtcblxuICAvKipcbiAgICogVGhlIFZpcHBzIFwiZmFsbGJhY2tcIiB1cmwsIGlzIHdoZXJlIHRoZSB1c2VyIHdpbGwgYmUgcmVkaXJlY3RlZFxuICAgKiB0byBhZnRlciBjb21wbGV0aW5nIHRoZSBWaXBwcyBjaGVja291dC5cbiAgICovXG4gIGNvbnN0IGZhbGxCYWNrVVJMID0gbmV3IFVSTChcbiAgICBgJHtzZXJ2aWNlQ2FsbGJhY2tIb3N0fS93ZWJob29rcy9wYXltZW50LXByb3ZpZGVycy92aXBwcy9mYWxsYmFjay8ke2NyeXN0YWxsaXplT3JkZXJJZH1gXG4gICk7XG4gIGZhbGxCYWNrVVJMLnNlYXJjaFBhcmFtcy5hcHBlbmQoXG4gICAgXCJjb25maXJtYXRpb25cIixcbiAgICBlbmNvZGVVUklDb21wb25lbnQoXG4gICAgICBjb25maXJtYXRpb25VUkwucmVwbGFjZShcIntjcnlzdGFsbGl6ZU9yZGVySWR9XCIsIGNyeXN0YWxsaXplT3JkZXJJZClcbiAgICApXG4gICk7XG4gIGZhbGxCYWNrVVJMLnNlYXJjaFBhcmFtcy5hcHBlbmQoXCJjaGVja291dFwiLCBlbmNvZGVVUklDb21wb25lbnQoY2hlY2tvdXRVUkwpKTtcblxuICBjb25zdCB2aXBwc0NsaWVudCA9IGF3YWl0IGdldENsaWVudCgpO1xuXG4gIGNvbnN0IHZpcHBzUmVzcG9uc2UgPSBhd2FpdCB2aXBwc0NsaWVudC5pbml0aWF0ZVBheW1lbnQoe1xuICAgIG9yZGVyOiB7XG4gICAgICBtZXJjaGFudEluZm86IHtcbiAgICAgICAgbWVyY2hhbnRTZXJpYWxOdW1iZXI6IFZJUFBTX01FUkNIQU5UX1NFUklBTCxcbiAgICAgICAgZmFsbEJhY2s6IGZhbGxCYWNrVVJMLnRvU3RyaW5nKCksXG4gICAgICAgIGNhbGxiYWNrUHJlZml4OiBgJHtzZXJ2aWNlQ2FsbGJhY2tIb3N0fS93ZWJob29rcy9wYXltZW50LXByb3ZpZGVycy92aXBwcy9vcmRlci11cGRhdGVgLFxuICAgICAgICBzaGlwcGluZ0RldGFpbHNQcmVmaXg6IGAke3NlcnZpY2VDYWxsYmFja0hvc3R9L3dlYmhvb2tzL3BheW1lbnQtcHJvdmlkZXJzL3ZpcHBzL3NoaXBwaW5nYCxcbiAgICAgICAgY29uc2VudFJlbW92YWxQcmVmaXg6IGAke3NlcnZpY2VDYWxsYmFja0hvc3R9L3dlYmhvb2tzL3BheW1lbnQtcHJvdmlkZXJzL3ZpcHBzL2NvbnN0ZW50LXJlbW92YWxgLFxuICAgICAgICBwYXltZW50VHlwZTogXCJlQ29tbSBFeHByZXNzIFBheW1lbnRcIixcbiAgICAgICAgaXNBcHA6IGZhbHNlLFxuICAgICAgICBzdGF0aWNTaGlwcGluZ0RldGFpbHM6IFtcbiAgICAgICAgICAvLyBQcm92aWRlIGEgZGVmYXVsdCBzaGlwcGluZyBtZXRob2RcbiAgICAgICAgICB7XG4gICAgICAgICAgICBpc0RlZmF1bHQ6IFwiWVwiLFxuICAgICAgICAgICAgcHJpb3JpdHk6IDAsXG4gICAgICAgICAgICBzaGlwcGluZ0Nvc3Q6IDAsXG4gICAgICAgICAgICBzaGlwcGluZ01ldGhvZDogXCJQb3N0ZW4gU2VydmljZXBha2tlXCIsXG4gICAgICAgICAgICBzaGlwcGluZ01ldGhvZElkOiBcInBvc3Rlbi1zZXJ2aWNlcGFra2VcIixcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfSxcbiAgICAgIGN1c3RvbWVySW5mbzoge30sXG4gICAgICB0cmFuc2FjdGlvbjoge1xuICAgICAgICBvcmRlcklkOiBjcnlzdGFsbGl6ZU9yZGVySWQsXG4gICAgICAgIGFtb3VudDogcGFyc2VJbnQodG90YWwuZ3Jvc3MgKiAxMDAsIDEwKSxcbiAgICAgICAgdHJhbnNhY3Rpb25UZXh0OiBcIkNyeXN0YWxsaXplIHRlc3QgdHJhbnNhY3Rpb25cIixcbiAgICAgIH0sXG4gICAgfSxcbiAgfSk7XG5cbiAgcmV0dXJuIHtcbiAgICBzdWNjZXNzOiB0cnVlLFxuICAgIGNoZWNrb3V0TGluazogdmlwcHNSZXNwb25zZS51cmwsXG4gICAgY3J5c3RhbGxpemVPcmRlcklkLFxuICB9O1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gYXN5bmMgZnVuY3Rpb24gdmlwcHNPcmRlclVwZGF0ZSh7IGNyeXN0YWxsaXplT3JkZXJJZCB9KSB7XG4gIGNvbnNvbGUubG9nKFwiVklQUFMgb3JkZXIgdXBkYXRlXCIpO1xuICBjb25zb2xlLmxvZyh7IGNyeXN0YWxsaXplT3JkZXJJZCB9KTtcblxuICAvLyBjb25zdCB7IGdldENsaWVudCB9ID0gcmVxdWlyZShcIi4vdXRpbHNcIik7XG4gIC8vIGNvbnN0IHZpcHBzQ2xpZW50ID0gYXdhaXQgZ2V0Q2xpZW50KCk7XG5cbiAgLy8gUmV0cmlldmUgdGhlIFZpcHBzIG9yZGVyIHRyYW5zYWN0aW9uIGRldGFpbHNcbiAgLy8gY29uc3Qgb3JkZXIgPSBhd2FpdCB2aXBwc0NsaWVudC5nZXRPcmRlckRldGFpbHMoe1xuICAvLyAgIG9yZGVySWQ6IGNyeXN0YWxsaXplT3JkZXJJZCxcbiAgLy8gfSk7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBhc3luYyBmdW5jdGlvbiB2aXBwc1VzZXJDb25zZW50UmVtb3ZhbCh7IHZpcHBzVXNlcklkIH0pIHtcbiAgLy8gY29uc3QgeyBnZXRDbGllbnQgfSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpO1xuICAvLyBjb25zdCB2aXBwc0NsaWVudCA9IGF3YWl0IGdldENsaWVudCgpO1xuXG4gIGNvbnNvbGUubG9nKFwiVklQUFMgdXNlciBjb25zZW50IHJlbW92YWxcIik7XG4gIGNvbnNvbGUubG9nKHsgdmlwcHNVc2VySWQgfSk7XG59O1xuIiwiY29uc3QgaW52YXJpYW50ID0gcmVxdWlyZShcImludmFyaWFudFwiKTtcblxuY29uc3QgVklQUFNfQ0xJRU5UX0lEID0gcHJvY2Vzcy5lbnYuVklQUFNfQ0xJRU5UX0lEO1xuY29uc3QgVklQUFNfQ0xJRU5UX1NFQ1JFVCA9IHByb2Nlc3MuZW52LlZJUFBTX0NMSUVOVF9TRUNSRVQ7XG5jb25zdCBWSVBQU19TVUJfS0VZID0gcHJvY2Vzcy5lbnYuVklQUFNfU1VCX0tFWTtcblxubGV0IGNsaWVudDtcbm1vZHVsZS5leHBvcnRzID0ge1xuICBnZXRDbGllbnQ6ICgpID0+IHtcbiAgICBpbnZhcmlhbnQoVklQUFNfQ0xJRU5UX0lELCBcInByb2Nlc3MuZW52LlZJUFBTX0NMSUVOVF9JRCBpcyBub3QgZGVmaW5lZFwiKTtcbiAgICBpbnZhcmlhbnQoXG4gICAgICBWSVBQU19DTElFTlRfU0VDUkVULFxuICAgICAgXCJwcm9jZXNzLmVudi5WSVBQU19DTElFTlRfU0VDUkVUIGlzIG5vdCBkZWZpbmVkXCJcbiAgICApO1xuICAgIGludmFyaWFudChWSVBQU19TVUJfS0VZLCBcInByb2Nlc3MuZW52LlZJUFBTX1NVQl9LRVkgaXMgbm90IGRlZmluZWRcIik7XG5cbiAgICBpZiAoIWNsaWVudCkge1xuICAgICAgY29uc3QgVmlwcHNDbGllbnQgPSByZXF1aXJlKFwiQGNyeXN0YWxsaXplL25vZGUtdmlwcHNcIik7XG4gICAgICBjbGllbnQgPSBuZXcgVmlwcHNDbGllbnQoe1xuICAgICAgICB0ZXN0RHJpdmU6IHRydWUsXG4gICAgICAgIGlkOiBWSVBQU19DTElFTlRfSUQsXG4gICAgICAgIHNlY3JldDogVklQUFNfQ0xJRU5UX1NFQ1JFVCxcbiAgICAgICAgc3Vic2NyaXB0aW9uSWQ6IFZJUFBTX1NVQl9LRVksXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gY2xpZW50O1xuICB9LFxufTtcbiIsImNvbnN0IGludmFyaWFudCA9IHJlcXVpcmUoXCJpbnZhcmlhbnRcIik7XG5cbmNvbnN0IGNyeXN0YWxsaXplID0gcmVxdWlyZShcIi4uL2NyeXN0YWxsaXplXCIpO1xuXG4vKipcbiAqIFRvZG86IGxpbmsgdG8gZ29vZCBKV1QgaW50cm9cbiAqL1xuY29uc3QgSldUX1NFQ1JFVCA9IHByb2Nlc3MuZW52LkpXVF9TRUNSRVQ7XG5cbi8vIENvb2tpZSBjb25maWcgZm9yIHVzZXIgSldUc1xuY29uc3QgQ09PS0lFX1VTRVJfVE9LRU5fTkFNRSA9IFwidXNlci10b2tlblwiO1xuY29uc3QgQ09PS0lFX1VTRVJfVE9LRU5fTUFYX0FHRSA9IDYwICogNjAgKiAyNDtcbmNvbnN0IENPT0tJRV9SRUZSRVNIX1RPS0VOX05BTUUgPSBcInVzZXItdG9rZW4tcmVmcmVzaFwiO1xuY29uc3QgQ09PS0lFX1JFRlJFU0hfVE9LRU5fTUFYX0FHRSA9IDYwICogNjAgKiAyNCAqIDc7XG5cbmFzeW5jIGZ1bmN0aW9uIGdldFVzZXIoeyBjb250ZXh0IH0pIHtcbiAgY29uc3QgdXNlckluQ29udGV4dCA9IGNvbnRleHQudXNlcjtcblxuICBjb25zdCB1c2VyID0ge1xuICAgIGlzTG9nZ2VkSW46IEJvb2xlYW4odXNlckluQ29udGV4dCAmJiBcImVtYWlsXCIgaW4gdXNlckluQ29udGV4dCksXG4gICAgZW1haWw6IHVzZXJJbkNvbnRleHQgJiYgdXNlckluQ29udGV4dC5lbWFpbCxcbiAgICBsb2dvdXRMaW5rOiBgJHtjb250ZXh0LnB1YmxpY0hvc3R9L3VzZXIvbG9nb3V0YCxcbiAgfTtcblxuICBpZiAodXNlciAmJiB1c2VyLmlzTG9nZ2VkSW4pIHtcbiAgICBjb25zdCBjcnlzdGFsbGl6ZUN1c3RvbWVyID0gYXdhaXQgY3J5c3RhbGxpemUuY3VzdG9tZXJzLmdldCh7XG4gICAgICBpZGVudGlmaWVyOiB1c2VyLmVtYWlsLFxuICAgIH0pO1xuICAgIGlmIChjcnlzdGFsbGl6ZUN1c3RvbWVyKSB7XG4gICAgICBPYmplY3QuYXNzaWduKHVzZXIsIGNyeXN0YWxsaXplQ3VzdG9tZXIpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB1c2VyO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgQ09PS0lFX1VTRVJfVE9LRU5fTkFNRSxcbiAgQ09PS0lFX1JFRlJFU0hfVE9LRU5fTkFNRSxcbiAgQ09PS0lFX1VTRVJfVE9LRU5fTUFYX0FHRSxcbiAgQ09PS0lFX1JFRlJFU0hfVE9LRU5fTUFYX0FHRSxcbiAgYXV0aGVudGljYXRlKHRva2VuKSB7XG4gICAgaW52YXJpYW50KEpXVF9TRUNSRVQsIFwicHJvY2Vzcy5lbnYuSldUX1NFQ1JFVCBpcyBub3QgZGVmaW5lZFwiKTtcblxuICAgIGlmICghdG9rZW4pIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IGp3dCA9IHJlcXVpcmUoXCJqc29ud2VidG9rZW5cIik7XG4gICAgY29uc3QgZGVjb2RlZCA9IGp3dC52ZXJpZnkodG9rZW4sIEpXVF9TRUNSRVQpO1xuICAgIGlmICghZGVjb2RlZCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGVtYWlsOiBkZWNvZGVkLmVtYWlsLFxuICAgIH07XG4gIH0sXG4gIGFzeW5jIHNlbmRNYWdpY0xpbmsoeyBlbWFpbCwgcmVkaXJlY3RVUkxBZnRlckxvZ2luLCBjb250ZXh0IH0pIHtcbiAgICBpbnZhcmlhbnQoSldUX1NFQ1JFVCwgXCJwcm9jZXNzLmVudi5KV1RfU0VDUkVUIGlzIG5vdCBkZWZpbmVkXCIpO1xuXG4gICAgY29uc3QgeyBwdWJsaWNIb3N0IH0gPSBjb250ZXh0O1xuXG4gICAgY29uc3QgY3J5c3RhbGxpemVDdXN0b21lciA9IGF3YWl0IGNyeXN0YWxsaXplLmN1c3RvbWVycy5nZXQoe1xuICAgICAgaWRlbnRpZmllcjogZW1haWwsXG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBJZiB0aGVyZSBpcyBubyBjdXN0b21lciByZWNvcmQgaW4gQ3J5c3RhbGxpemUsIHdlIHdpbGxcbiAgICAgKiBjcmVhdGUgb25lLlxuICAgICAqXG4gICAgICogWW91IGNhbiBjaG9vc2UgTk9UIHRvIGNyZWF0ZSBhIGN1c3RvbWVyIGF0IHRoaXMgcG9pbnQsXG4gICAgICogYW5kIHByb2hpYml0IGxvZ2lucyBmb3Igbm9uZSBjdXN0b21lcnNcbiAgICAgKi9cbiAgICBpZiAoIWNyeXN0YWxsaXplQ3VzdG9tZXIpIHtcbiAgICAgIC8vIHJldHVybiB7XG4gICAgICAvLyAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgLy8gICBlcnJvcjogXCJDVVNUT01FUl9OT1RfRk9VTkRcIixcbiAgICAgIC8vIH07XG4gICAgICBjb25zdCBlbWFpbFBhcnRzID0gZW1haWwuc3BsaXQoXCJAXCIpO1xuICAgICAgYXdhaXQgY3J5c3RhbGxpemUuY3VzdG9tZXJzLmNyZWF0ZSh7XG4gICAgICAgIGlkZW50aWZpZXI6IGVtYWlsLFxuICAgICAgICBmaXJzdE5hbWU6IGVtYWlsUGFydHNbMF0sXG4gICAgICAgIGxhc3ROYW1lOiBlbWFpbFBhcnRzWzFdLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyBpcyB0aGUgcGFnZSByZXNwb25zaWJsZSBvZiByZWNlaXZpbmcgdGhlIG1hZ2ljXG4gICAgICogbGluayB0b2tlbiwgYW5kIHRoZW4gY2FsbGluZyB0aGUgdmFsaWRhdGVNYWdpY0xpbmtUb2tlblxuICAgICAqIGZ1bmN0aW9uIGZyb20gdXNlclNlcnZpY2UuXG4gICAgICovXG4gICAgY29uc3QgbG9naW5MaW5rID0gbmV3IFVSTChgJHtwdWJsaWNIb3N0fS91c2VyL2xvZ2luLW1hZ2ljLWxpbmtgKTtcblxuICAgIC8qKlxuICAgICAqIEFkZCB0aGUgSldUIHRvIHRoZSBjYWxsYmFjayB1cmxcbiAgICAgKiBXaGVuIHRoZSBsaW5rIGlzIHZpc2l0ZWQsIHdlIGNhbiB2YWxpZGF0ZSB0aGUgdG9rZW5cbiAgICAgKiBhZ2FpbiBpbiB0aGUgdmFsaWRhdGVNYWdpY0xpbmtUb2tlbiBtZXRob2RcbiAgICAgKi9cbiAgICBjb25zdCBqd3QgPSByZXF1aXJlKFwianNvbndlYnRva2VuXCIpO1xuICAgIGxvZ2luTGluay5zZWFyY2hQYXJhbXMuYXBwZW5kKFxuICAgICAgXCJ0b2tlblwiLFxuICAgICAgand0LnNpZ24oeyBlbWFpbCwgcmVkaXJlY3RVUkxBZnRlckxvZ2luIH0sIEpXVF9TRUNSRVQsIHtcbiAgICAgICAgZXhwaXJlc0luOiBcIjFoXCIsXG4gICAgICB9KVxuICAgICk7XG5cbiAgICBjb25zdCBlbWFpbFNlcnZpY2UgPSByZXF1aXJlKFwiLi4vZW1haWwtc2VydmljZVwiKTtcblxuICAgIGNvbnN0IHsgc3VjY2VzcyB9ID0gYXdhaXQgZW1haWxTZXJ2aWNlLnNlbmRVc2VyTWFnaWNMaW5rKHtcbiAgICAgIGxvZ2luTGluazogbG9naW5MaW5rLnRvU3RyaW5nKCksXG4gICAgICBlbWFpbCxcbiAgICB9KTtcblxuICAgIHJldHVybiB7IHN1Y2Nlc3MgfTtcbiAgfSxcbiAgdmFsaWRhdGVNYWdpY0xpbmtUb2tlbih0b2tlbikge1xuICAgIGludmFyaWFudChKV1RfU0VDUkVULCBcInByb2Nlc3MuZW52LkpXVF9TRUNSRVQgaXMgbm90IGRlZmluZWRcIik7XG5cbiAgICAvKipcbiAgICAgKiBIZXJlIHdlIHdvdWxkIHdhbnQgdG8gZmV0Y2ggYW4gZW50cnkgbWF0Y2hpbmcgdGhlIHByb3ZpZGVkIHRva2VuIGZyb20gb3VyXG4gICAgICogZGF0YXN0b3JlLiBUaGlzIGJvaWxlcnBsYXRlIGRvZXMgbm90IGhhdmUgYSBkYXRhc3RvcmUgY29ubmVjdGVkIHRvIGl0IHlldFxuICAgICAqIHNvIHdlIHdpbGwganVzdCBhc3N1bWUgdGhlIHRva2VuIGlzIGZvciBhIHJlYWwgdXNlciBhbmQgc2lnbiBhIGxvZ2luIHRva2VuXG4gICAgICogYWNjb3JkaW5nbHkuXG4gICAgICovXG5cbiAgICB0cnkge1xuICAgICAgY29uc3Qgand0ID0gcmVxdWlyZShcImpzb253ZWJ0b2tlblwiKTtcbiAgICAgIGNvbnN0IGRlY29kZWQgPSBqd3QudmVyaWZ5KHRva2VuLCBKV1RfU0VDUkVUKTtcbiAgICAgIGNvbnN0IHsgZW1haWwsIHJlZGlyZWN0VVJMQWZ0ZXJMb2dpbiB9ID0gZGVjb2RlZDtcblxuICAgICAgY29uc3Qgc2lnbmVkTG9naW5Ub2tlbiA9IGp3dC5zaWduKHsgZW1haWwgfSwgSldUX1NFQ1JFVCwge1xuICAgICAgICBleHBpcmVzSW46IENPT0tJRV9VU0VSX1RPS0VOX01BWF9BR0UsXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IHNpZ25lZExvZ2luUmVmcmVzaFRva2VuID0gand0LnNpZ24oeyBlbWFpbCB9LCBKV1RfU0VDUkVULCB7XG4gICAgICAgIGV4cGlyZXNJbjogQ09PS0lFX1JFRlJFU0hfVE9LRU5fTUFYX0FHRSxcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICBzaWduZWRMb2dpblRva2VuLFxuICAgICAgICBDT09LSUVfVVNFUl9UT0tFTl9NQVhfQUdFLFxuICAgICAgICBzaWduZWRMb2dpblJlZnJlc2hUb2tlbixcbiAgICAgICAgcmVkaXJlY3RVUkxBZnRlckxvZ2luLFxuICAgICAgICBDT09LSUVfUkVGUkVTSF9UT0tFTl9NQVhfQUdFLFxuICAgICAgfTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIGVycm9yLFxuICAgICAgfTtcbiAgICB9XG4gIH0sXG4gIHZhbGlkYXRlUmVmcmVzaFRva2VuKHsgcmVmcmVzaFRva2VuLCBlbWFpbCB9KSB7XG4gICAgaWYgKCFyZWZyZXNoVG9rZW4gfHwgIWVtYWlsKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGp3dCA9IHJlcXVpcmUoXCJqc29ud2VidG9rZW5cIik7XG4gICAgICBjb25zdCBkZWNvZGVkID0gand0LnZlcmlmeShyZWZyZXNoVG9rZW4sIEpXVF9TRUNSRVQpO1xuICAgICAgaWYgKGRlY29kZWQuZW1haWwgPT09IGVtYWlsKSB7XG4gICAgICAgIHJldHVybiBqd3Quc2lnbih7IGVtYWlsIH0sIEpXVF9TRUNSRVQsIHtcbiAgICAgICAgICBleHBpcmVzSW46IENPT0tJRV9VU0VSX1RPS0VOX01BWF9BR0UsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUubG9nKGUpO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfSxcbiAgZ2V0VXNlcixcbiAgYXN5bmMgdXBkYXRlKHsgY29udGV4dCwgaW5wdXQgfSkge1xuICAgIGNvbnN0IHsgdXNlciB9ID0gY29udGV4dDtcbiAgICBpZiAoIXVzZXIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vIHVzZXIgZm91bmQgaW4gY29udGV4dFwiKTtcbiAgICB9XG4gICAgYXdhaXQgY3J5c3RhbGxpemUuY3VzdG9tZXJzLnVwZGF0ZSh7XG4gICAgICBpZGVudGlmaWVyOiB1c2VyLmVtYWlsLFxuICAgICAgY3VzdG9tZXI6IGlucHV0LFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGdldFVzZXIoeyBjb250ZXh0IH0pO1xuICB9LFxufTtcbiIsImNvbnN0IHsgY2FsbENhdGFsb2d1ZUFwaSB9ID0gcmVxdWlyZShcIi4uL2NyeXN0YWxsaXplL3V0aWxzXCIpO1xuXG4vKipcbiAqIEV4YW1wbGUgb2YgaG93IHRvIHVzZSBDcnlzdGFsbGl6ZSB0byBzdG9yZSBhbmRcbiAqIG1hbmFnZSB2b3VjaGVycy5cbiAqXG4gKiBFeHBlY3RlZCBjYXRhbG9ndWUgc3RydWN0dXJlOlxuICogX3ZvdWNoZXJzXG4gKiAgLSB2b3VjaGVyXzFcbiAqICAtIHZvdWNoZXJfMlxuICogIC0gLi4uXG4gKiAgLSB2b3VjaGVyX25cbiAqXG4gKiBFYWNoIHZvdWNoZXIgaXMgYmFzZWQgb24gdGhlIGZvbGxvd2luZyBzaGFwZVxuICogY29kZSAoc2luZ2xlTGluZSlcbiAqIGRpc2NvdW50IChjaG9pY2VDb21wb25lbnQpXG4gKiAgLSBwZXJjZW50IChudW1lcmljKVxuICogIC0gYW1vdW50IChudW1lcmljKVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGFzeW5jIGZ1bmN0aW9uIGdldENyeXN0YWxsaXplVm91Y2hlcnMoKSB7XG4gIGNvbnN0IHZvdWNoZXJzRnJvbUNyeXN0YWxsaXplID0gYXdhaXQgY2FsbENhdGFsb2d1ZUFwaSh7XG4gICAgcXVlcnk6IGBcbiAgICAgIHtcbiAgICAgICAgY2F0YWxvZ3VlKGxhbmd1YWdlOiBcImVuXCIsIHBhdGg6IFwiL3ZvdWNoZXJzXCIpIHtcbiAgICAgICAgICBjaGlsZHJlbiB7XG4gICAgICAgICAgICBuYW1lXG4gICAgICAgICAgICBjb2RlOiBjb21wb25lbnQoaWQ6IFwiY29kZVwiKSB7XG4gICAgICAgICAgICAgIGNvbnRlbnQge1xuICAgICAgICAgICAgICAgIC4uLiBvbiBTaW5nbGVMaW5lQ29udGVudCB7XG4gICAgICAgICAgICAgICAgICB0ZXh0XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkaXNjb3VudDogY29tcG9uZW50KGlkOiBcImRpc2NvdW50XCIpIHtcbiAgICAgICAgICAgICAgY29udGVudCB7XG4gICAgICAgICAgICAgICAgLi4uIG9uIENvbXBvbmVudENob2ljZUNvbnRlbnQge1xuICAgICAgICAgICAgICAgICAgc2VsZWN0ZWRDb21wb25lbnQge1xuICAgICAgICAgICAgICAgICAgICBpZFxuICAgICAgICAgICAgICAgICAgICBjb250ZW50IHtcbiAgICAgICAgICAgICAgICAgICAgICAuLi4gb24gTnVtZXJpY0NvbnRlbnQge1xuICAgICAgICAgICAgICAgICAgICAgICAgbnVtYmVyXG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgYCxcbiAgfSk7XG5cbiAgaWYgKFxuICAgICF2b3VjaGVyc0Zyb21DcnlzdGFsbGl6ZS5kYXRhIHx8XG4gICAgIXZvdWNoZXJzRnJvbUNyeXN0YWxsaXplLmRhdGEuY2F0YWxvZ3VlXG4gICkge1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIHJldHVybiB2b3VjaGVyc0Zyb21DcnlzdGFsbGl6ZS5kYXRhLmNhdGFsb2d1ZS5jaGlsZHJlbi5tYXAoXG4gICAgKHZvdWNoZXJGcm9tQ3J5c3RhbGxpemUpID0+IHtcbiAgICAgIGNvbnN0IGRpc2NvdW50Q29tcG9uZW50ID1cbiAgICAgICAgdm91Y2hlckZyb21DcnlzdGFsbGl6ZS5kaXNjb3VudC5jb250ZW50LnNlbGVjdGVkQ29tcG9uZW50O1xuXG4gICAgICBsZXQgZGlzY291bnRBbW91bnQgPSBudWxsO1xuICAgICAgbGV0IGRpc2NvdW50UGVyY2VudCA9IG51bGw7XG4gICAgICBpZiAoZGlzY291bnRDb21wb25lbnQuaWQgPT09IFwicGVyY2VudFwiKSB7XG4gICAgICAgIGRpc2NvdW50UGVyY2VudCA9IGRpc2NvdW50Q29tcG9uZW50LmNvbnRlbnQubnVtYmVyO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZGlzY291bnRBbW91bnQgPSBkaXNjb3VudENvbXBvbmVudC5jb250ZW50Lm51bWJlcjtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY29kZTogdm91Y2hlckZyb21DcnlzdGFsbGl6ZS5jb2RlLmNvbnRlbnQudGV4dCxcbiAgICAgICAgZGlzY291bnRBbW91bnQsXG4gICAgICAgIGRpc2NvdW50UGVyY2VudCxcbiAgICAgICAgb25seUZvckF1dGhvcmlzZWRVc2VyOiBmYWxzZSxcbiAgICAgIH07XG4gICAgfVxuICApO1xufTtcbiIsImNvbnN0IGdldENyeXN0YWxsaXplVm91Y2hlcnMgPSByZXF1aXJlKFwiLi9jcnlzdGFsbGl6ZS12b3VjaGVycy1leGFtcGxlXCIpO1xuXG4vKipcbiAqIEV4YW1wbGUgb2YgYSB2b3VjaGVyIHJlZ2lzdGVyXG4gKiBZb3UgY2FuIGN1c3RvbWlzZSB0aGlzIHRvIGNhbGwgYW4gZXh0ZXJuYWwgc2VydmljZVxuICogb3Iga2VlcCBzdGF0aWMgdm91Y2hlcnMgbGlrZSB0aGlzXG4gKi9cbmNvbnN0IHZvdWNoZXJSZWdpc3RlciA9IFtcbiAge1xuICAgIGNvZGU6IFwib2stZGVhbFwiLFxuICAgIGRpc2NvdW50QW1vdW50OiAyLFxuICAgIGRpc2NvdW50UGVyY2VudDogbnVsbCxcbiAgICBvbmx5Rm9yQXV0aG9yaXNlZFVzZXI6IGZhbHNlLFxuICB9LFxuICB7XG4gICAgY29kZTogXCJmYWlyLWRlYWxcIixcbiAgICBkaXNjb3VudEFtb3VudDogbnVsbCxcbiAgICBkaXNjb3VudFBlcmNlbnQ6IDUsXG4gICAgb25seUZvckF1dGhvcmlzZWRVc2VyOiBmYWxzZSxcbiAgfSxcbiAge1xuICAgIGNvZGU6IFwiYXdlc29tZS1kZWFsLWxvZ2dlZC1pblwiLFxuICAgIGRpc2NvdW50QW1vdW50OiBudWxsLFxuICAgIGRpc2NvdW50UGVyY2VudDogMTAsXG4gICAgb25seUZvckF1dGhvcmlzZWRVc2VyOiB0cnVlLFxuICB9LFxuICB7XG4gICAgY29kZTogXCJnb29kLWRlYWwtbG9nZ2VkLWluXCIsXG4gICAgZGlzY291bnRBbW91bnQ6IDEwMCxcbiAgICBkaXNjb3VudFBlcmNlbnQ6IG51bGwsXG4gICAgb25seUZvckF1dGhvcmlzZWRVc2VyOiB0cnVlLFxuICB9LFxuXTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGFzeW5jIGdldCh7IGNvZGUsIGNvbnRleHQgfSkge1xuICAgIGNvbnN0IHsgdXNlciB9ID0gY29udGV4dDtcblxuICAgIGNvbnN0IGlzQW5vbnltb3VzVXNlciA9ICF1c2VyIHx8ICF1c2VyLmVtYWlsO1xuXG4gICAgY29uc3QgYWxsQ3J5c3RhbGxpemVWb3VjaGVycyA9IGF3YWl0IGdldENyeXN0YWxsaXplVm91Y2hlcnMoKTtcblxuICAgIGNvbnN0IGFsbFZvdWNoZXJzID0gWy4uLnZvdWNoZXJSZWdpc3RlciwgLi4uYWxsQ3J5c3RhbGxpemVWb3VjaGVyc107XG5cbiAgICAvLyBBcyBkZWZhdWx0LCBub3QgYWxsIHRoZSB2b3VjaGVycyB3b3JrIGZvciBhbm9ueW1vdXMgdXNlcnMuXG4gICAgLy8gQXMgeW91J2xsIHNlZSBpbiB0aGUgY29uZmlndXJhdGlvbiBhYm92ZSwgc29tZSBuZWVkIHRoZSB1c2VyIHRvIGJlIGxvZ2dlZCBpblxuICAgIGlmIChpc0Fub255bW91c1VzZXIpIHtcbiAgICAgIGNvbnN0IHZvdWNoZXIgPSBhbGxWb3VjaGVyc1xuICAgICAgICAuZmlsdGVyKCh2KSA9PiAhdi5vbmx5Rm9yQXV0aG9yaXNlZFVzZXIpXG4gICAgICAgIC5maW5kKCh2KSA9PiB2LmNvZGUgPT09IGNvZGUpO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBpc1ZhbGlkOiBCb29sZWFuKHZvdWNoZXIpLFxuICAgICAgICB2b3VjaGVyLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBTZWFyY2ggYWxsIHZvdWNoZXJzIGZvciBhdXRoZW50aWNhdGVkIHVzZXJzXG4gICAgbGV0IHZvdWNoZXIgPSBhbGxWb3VjaGVycy5maW5kKCh2KSA9PiB2LmNvZGUgPT09IGNvZGUpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGlzVmFsaWQ6IEJvb2xlYW4odm91Y2hlciksXG4gICAgICB2b3VjaGVyLFxuICAgIH07XG4gIH0sXG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiQGNyeXN0YWxsaXplL25vZGUta2xhcm5hXCIpOzsiLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCJAY3J5c3RhbGxpemUvbm9kZS12aXBwc1wiKTs7IiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiQG1vbGxpZS9hcGktY2xpZW50XCIpOzsiLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCJAc2VuZGdyaWQvbWFpbFwiKTs7IiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiYXBvbGxvLXNlcnZlci1taWNyb1wiKTs7IiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiZ3JhcGhxbC10YWdcIik7OyIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcImludmFyaWFudFwiKTs7IiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwianNvbndlYnRva2VuXCIpOzsiLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCJtam1sXCIpOzsiLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCJub2RlLWZldGNoXCIpOzsiLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCJzdHJpcGVcIik7OyJdLCJzb3VyY2VSb290IjoiIn0=