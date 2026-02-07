/**
 * VAPF (Variant/Attribute/Price/Filter) Type Definitions
 * 
 * Maps to config/e-commerce.php -> vapf section
 */

export type StockStatus = 'in_stock' | 'out_of_stock' | 'on_backorder';
export type PriceModifierType = 'fixed' | 'percentage';
export type DatatableSortOption = 'sort_order' | 'name' | 'created_at';
export type AttributeType = 'select' | 'radio' | 'checkbox' | 'color' | 'image';

export interface ProductVariant {
  id: string;
  label: string;
  value: string;
  price_modifier: number;
  sku?: string;
  stock_status?: StockStatus;
  thumbnail?: string;
  sort_order: number;
}

export interface VAPFVariantConfig {
  enabled: boolean;
  max_options_per_product: number;
  max_values_per_option: number;
  allow_multiple_selection: boolean;
  generate_sku_from_variant: boolean;
}

export interface VAPFAttributeConfig {
  default_types: AttributeType[];
  required_by_default: boolean;
  show_in_listing: boolean;
  show_in_filters: boolean;
}

export interface VAPFPriceModifierConfig {
  enabled: boolean;
  type: PriceModifierType;
  allow_negative: boolean;
  apply_tax_to_modifiers: boolean;
}

export interface VAPFFilterConfig {
  enabled: boolean;
  show_count: boolean;
  collapse_by_default: boolean;
  max_visible_options: number;
  enable_search: boolean;
}

export interface VAPFDatatableConfig {
  show_thumbnail: boolean;
  show_price_modifier: boolean;
  show_stock_status: boolean;
  default_sort: DatatableSortOption;
  items_per_page: number;
}

export interface VAPFValidationConfig {
  option_name_max_length: number;
  option_value_max_length: number;
  option_slug_pattern: string;
}

export interface VAPFConfig {
  variants: VAPFVariantConfig;
  attributes: VAPFAttributeConfig;
  price_modifiers: VAPFPriceModifierConfig;
  filters: VAPFFilterConfig;
  datatable: VAPFDatatableConfig;
  validation: VAPFValidationConfig;
}

export type PartialVAPFConfig = {
  [K in keyof VAPFConfig]?: Partial<VAPFConfig[K]>;
};
