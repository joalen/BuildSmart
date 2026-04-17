from pydantic import BaseModel
from typing import List, Optional

class Product(BaseModel):
    itemId: str
    brand: Optional[str] = None
    name: Optional[str] = None
    price: Optional[float] = None
    image: Optional[str] = None
    url: Optional[str] = None

class SearchRequest(BaseModel):
    keyword: str
    storeId: Optional[str] = "6537"
    zipCode: Optional[str] = "75150"
    pageSize: Optional[int] = 12

class FilteredSearchRequest(BaseModel):
    keyword: str
    storeId: str
    zipCode: str | None = None
    pageSize: int = 24
    filter_keys: list[str] = []
    base_nav: str = ""

class SearchResponse(BaseModel):
    keyword: str
    products: List[Product]
    total: Optional[int] = None

class RecsRequest(BaseModel):
    item_id: str
    store_id: str = "121"
    zip_code: str = "75150"