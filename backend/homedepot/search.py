import re
import json
from homedepot.session import HomeDepotSession
from homedepot.schema import SearchRequest, SearchResponse, Product
import logging

logger = logging.getLogger(__name__)

SEARCH_QUERY = """
query searchModel(
  $startIndex: Int
  $pageSize: Int
  $orderBy: ProductSort
  $filter: ProductFilter
  $storeId: String
  $zipCode: String
  $skipFavoriteCount: Boolean = false
  $skipKPF: Boolean = false
  $skipSpecificationGroup: Boolean = false
  $skipSubscribeAndSave: Boolean = false
  $keyword: String
  $navParam: String
  $storefilter: StoreFilter = ALL
  $itemIds: [String]
  $channel: Channel = DESKTOP
  $additionalSearchParams: AdditionalParams
  $loyaltyMembershipInput: LoyaltyMembershipInput
) {
  searchModel(
    keyword: $keyword
    navParam: $navParam
    storefilter: $storefilter
    storeId: $storeId
    itemIds: $itemIds
    channel: $channel
    additionalSearchParams: $additionalSearchParams
    loyaltyMembershipInput: $loyaltyMembershipInput
  ) {
    metadata {
      hasPLPBanner
      categoryID
      analytics {
        semanticTokens
        dynamicLCA
        __typename
      }
      canonicalUrl
      searchRedirect
      clearAllRefinementsURL
      contentType
      h1Tag
      isStoreDisplay
      productCount {
        inStore
        __typename
      }
      stores {
        storeId
        storeName
        address {
          postalCode
          __typename
        }
        nearByStores {
          storeId
          storeName
          distance
          address {
            postalCode
            __typename
          }
          __typename
        }
        __typename
      }
      __typename
    }
    products(
      startIndex: $startIndex
      pageSize: $pageSize
      orderBy: $orderBy
      filter: $filter
    ) {
      identifiers {
        storeSkuNumber
        canonicalUrl
        brandName
        itemId
        productLabel
        productType
        specialOrderSku
        modelNumber
        parentId
        isSuperSku
        sampleId
        __typename
      }
      itemId
      dataSources
      media {
        images {
          url
          type
          subType
          sizes
          __typename
        }
        __typename
      }
      pricing(storeId: $storeId) {
        value
        alternatePriceDisplay
        alternate {
          bulk {
            pricePerUnit
            thresholdQuantity
            value
            __typename
          }
          unit {
            caseUnitOfMeasure
            unitsOriginalPrice
            unitsPerCase
            value
            __typename
          }
          __typename
        }
        original
        mapAboveOriginalPrice
        message
        preferredPriceFlag
        promotion {
          type
          description {
            shortDesc
            longDesc
            __typename
          }
          dollarOff
          percentageOff
          promotionTag
          savingsCenter
          savingsCenterPromos
          specialBuySavings
          specialBuyDollarOff
          specialBuyPercentageOff
          dates {
            start
            end
            __typename
          }
          __typename
        }
        specialBuy
        unitOfMeasure
        __typename
      }
      reviews {
        ratingsReviews {
          averageRating
          totalReviews
          __typename
        }
        __typename
      }
      info {
        swatches {
          isSelected
          itemId
          label
          swatchImgUrl
          url
          value
          __typename
        }
        hidePrice
        ecoRebate
        quantityLimit
        categoryHierarchy
        sskMin
        sskMax
        unitOfMeasureCoverage
        wasMaxPriceRange
        wasMinPriceRange
        productSubType {
          name
          link
          __typename
        }
        customerSignal {
          previouslyPurchased
          __typename
        }
        isBuryProduct
        isGenericProduct
        returnable
        isLiveGoodsProduct
        isSponsored
        sponsoredMetadata {
          campaignId
          placementId
          slotId
          sponsoredId
          trackSource
          __typename
        }
        globalCustomConfigurator {
          customExperience
          __typename
        }
        augmentedReality
        sponsoredBeacon {
          onClickBeacon
          onViewBeacon
          onClickBeacons
          onViewBeacons
          __typename
        }
        hasSubscription
        samplesAvailable
        productDepartmentId
        productDepartment
        totalNumberOfOptions
        paintBrand
        dotComColorEligible
        classNumber
        __typename
      }
      details {
        installation {
          serviceType
          __typename
        }
        collection {
          name
          url
          collectionId
          __typename
        }
        highlights
        __typename
      }
      fulfillment(storeId: $storeId, zipCode: $zipCode) {
        anchorStoreStatus
        anchorStoreStatusType
        backordered
        backorderedShipDate
        bossExcludedShipStates
        excludedShipStates
        seasonStatusEligible
        fulfillmentOptions {
          type
          fulfillable
          services {
            deliveryTimeline
            deliveryDates {
              startDate
              endDate
              __typename
            }
            deliveryCharge
            dynamicEta {
              hours
              minutes
              __typename
            }
            hasFreeShipping
            freeDeliveryThreshold
            locations {
              curbsidePickupFlag
              isBuyInStoreCheckNearBy
              distance
              inventory {
                isOutOfStock
                isInStock
                isLimitedQuantity
                isUnavailable
                quantity
                maxAllowedBopisQty
                minAllowedBopisQty
                __typename
              }
              isAnchor
              locationId
              state
              storeName
              storePhone
              type
              __typename
            }
            type
            totalCharge
            __typename
          }
          __typename
        }
        onlineStoreStatus
        onlineStoreStatusType
        __typename
      }
      availabilityType {
        type
        discontinued
        buyable
        status
        __typename
      }
      badges(storeId: $storeId) {
        name
        label
        __typename
      }
      dataSource
      favoriteDetail @skip(if: $skipFavoriteCount) {
        count
        __typename
      }
      keyProductFeatures @skip(if: $skipKPF) {
        keyProductFeaturesItems {
          features {
            name
            refinementId
            refinementUrl
            value
            __typename
          }
          __typename
        }
        __typename
      }
      specificationGroup @skip(if: $skipSpecificationGroup) {
        specifications {
          specName
          specValue
          __typename
        }
        specTitle
        __typename
      }
      subscription @skip(if: $skipSubscribeAndSave) {
        defaultfrequency
        discountPercentage
        subscriptionEnabled
        __typename
      }
      sizeAndFitDetail {
        attributeGroups {
          attributes {
            attributeName
            dimensions
            __typename
          }
          dimensionLabel
          productType
          __typename
        }
        __typename
      }
      __typename
    }
    taxonomy {
      breadCrumbs {
        browseUrl
        creativeIconUrl
        deselectUrl
        dimensionName
        label
        refinementKey
        url
        dimensionId
        __typename
      }
      brandLinkUrl
      __typename
    }
    searchReport {
      keyword
      totalProducts
      didYouMean
      correctedKeyword
      pageSize
      searchUrl
      sortBy
      sortOrder
      startIndex
      __typename
    }
    id
    relatedResults {
      universalSearch {
        title
        __typename
      }
      relatedServices {
        label
        __typename
      }
      visualNavs {
        label
        imageId
        webUrl
        categoryId
        imageURL
        __typename
      }
      visualNavContainsEvents
      relatedKeywords {
        keyword
        __typename
      }
      __typename
    }
    dimensions {
      label
      refinements {
        refinementKey
        label
        recordCount
        selected
        imgUrl
        url
        nestedRefinements {
          label
          url
          recordCount
          refinementKey
          __typename
        }
        __typename
      }
      collapse
      dimensionId
      isVisualNav
      isVisualDimension
      isNumericFilter
      isColorSwatch
      nestedRefinementsLimit
      visualNavSequence
      __typename
    }
    appliedDimensions {
      label
      refinements {
        label
        refinementKey
        url
        __typename
      }
      isNumericFilter
      __typename
    }
    __typename
  }
}
"""

def build_nav_param(base_nav: str, selected_keys: list[str]) -> str:
    """
    base_nav: e.g. "N-5yc1vZc8d3" (category)
    selected_keys: refinementKeys from filter_catalog
    """
    if not selected_keys:
        return base_nav
    
    base = base_nav.lstrip("N-")
    combined = "Z".join([base] + selected_keys)
    return f"N-{combined}"

def _parse_products(raw_products: list) -> list[Product]:
    products = []
    for p in raw_products:
        identifiers = p.get("identifiers", {})
        pricing = p.get("pricing") or {}
        images = p.get("media", {}).get("images", [])
        image_url = images[0].get("url").replace("<SIZE>", "300") if images else None
        canonical = identifiers.get("canonicalUrl", "")

        fulfillment = _parse_fulfillment(p)
        bopis = fulfillment.get("bopis", {})

        products.append(Product(
            itemId=p.get("itemId"),
            brand=identifiers.get("brandName"),
            name=identifiers.get("productLabel"),
            price=pricing.get("value"),
            image=image_url,
            url=f"https://www.homedepot.com{canonical}" if canonical else None,
            in_stock=bopis.get("isInStock", False),
            store_name=bopis.get("storeName"),
            quantity=bopis.get("quantity"),
        ))

    return products

def _parse_filter_catalog(dimensions: list) -> dict[str, dict[str, str]]:
    return {
        dim["label"]: {
            r["label"]: r["refinementKey"]
            for r in dim["refinements"]
            if r.get("refinementKey")
        }
        for dim in dimensions
    }

def _parse_fulfillment(product: dict) -> dict:
    options = product.get("fulfillment", {}).get("fulfillmentOptions") or []
    result = {}
    for option in options:
        for service in option.get("services", []):
            for location in service.get("locations", []):
                inventory = location.get("inventory", {})
                result[service["type"]] = {
                    "storeName": location.get("storeName"),
                    "locationId": location.get("locationId"),
                    "quantity": inventory.get("quantity"),
                    "isInStock": inventory.get("isInStock"),
                    "deliveryTimeline": service.get("deliveryTimeline"),
                }
    return result

async def search_products(
    session: HomeDepotSession,
    request: SearchRequest,
    nav_param: str = "",
    _redirected: bool = False
) -> SearchResponse:

    payload = json.loads(json.dumps(session.payload_template))
    payload["variables"]["keyword"] = request.keyword
    payload["variables"]["navParam"] = nav_param
    payload["variables"]["storeId"] = request.storeId
    payload["variables"]["startIndex"] = 0
    payload["variables"]["pageSize"] = request.pageSize
    payload["variables"]["additionalSearchParams"]["deliveryZip"] = request.zipCode or "75150"
    payload["query"] = SEARCH_QUERY

    # Fire from inside Brave — bypasses Akamai completely
    result = await session.page.evaluate("""
        async ({ url, payload }) => {
            const resp = await fetch(url, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "x-experience-name": "browse-desktop",
                    "x-debug": "false",
                    "x-hd-dc": "origin",
                },
                body: JSON.stringify(payload)
            });
            const status = resp.status;
            const data = await resp.json();
            return { status, data };
        }
    """, {"url": session.url, "payload": payload})

    status = result["status"]
    data = result["data"]

    if status not in (200, 206):
        logger.error(f"Search failed with status {status}")
        return SearchResponse(keyword=request.keyword, products=[], total=0)

    gql_data = data.get("data") or {}
    search_model = gql_data.get("searchModel")
    
    if search_model is None:
        errors = data.get("errors")
        logger.error(f"searchModel missing from response. Errors: {errors}. Keys: {list(gql_data.keys())}")
        return SearchResponse(keyword=request.keyword, products=[], total=0)
    
    session.filter_catalog = _parse_filter_catalog(
        search_model.get("dimensions", [])
    )

    stores_meta = (search_model.get("metadata") or {}).get("stores") or {}
    for store in stores_meta.get("nearByStores", []):
        postal = store["address"]["postalCode"]
        session.nearby_stores[postal] = store["storeId"]

    anchor_zip = stores_meta.get("address", {}).get("postalCode")
    anchor_id = stores_meta.get("storeId")
    if anchor_zip and anchor_id:
        session.nearby_stores[anchor_zip] = anchor_id

    redirect = (search_model.get("metadata") or {}).get("searchRedirect")
    if redirect and not _redirected:
        match = re.search(r'N-(\w+)', redirect)
        if match:
            logger.debug(f"Redirecting to navParam: N-{match.group(1)}")
            return await search_products(
                session,
                request,
                nav_param=f"N-{match.group(1)}",
                _redirected=True
            )

    raw_products = search_model.get("products") or []
    total = (search_model.get("searchReport") or {}).get("totalProducts")

    return SearchResponse(
        keyword=request.keyword,
        products=_parse_products(raw_products),
        total=total,
    )

async def find_swap(
    session: HomeDepotSession,
    oos_product: Product,
    store_id: str,
    base_nav: str,
) -> Product | None:
    nav = build_nav_param(base_nav, ["1z175a5"])
    results = await search_products(
        session,
        SearchRequest(keyword=oos_product.name.split()[0], storeId=store_id),
        nav_param=nav
    )
    
    candidates = [
        p for p in results.products
        if p.itemId != oos_product.itemId
        and p.in_stock
        and p.price is not None
        and oos_product.price is not None
        and abs(p.price - oos_product.price) / oos_product.price <= 0.20
    ]
    
    if not candidates:
        return None
    
    # return closest price match
    return min(candidates, key=lambda p: abs(p.price - oos_product.price))