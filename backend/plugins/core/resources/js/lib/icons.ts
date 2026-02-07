import {
  // Navigation & Layout
  LayoutGrid, Home, Menu, Navigation, Compass, Map,

  // Content & Files
  FileText, File, FileIcon, Folder, Archive, Database,

  // E-commerce
  Package, ShoppingCart, ShoppingBag, Tag, CreditCard, Wallet, DollarSign,

  // Settings & System
  Settings, Settings2, Server, Terminal, Code, Cpu, HardDrive,

  // Users & Auth
  User, Users, UserPlus, UserCheck, UserMinus, UserX,
  LogOut, LogIn, Lock, Unlock, Key, Shield,

  // Communication
  Mail, MailOpen, Send, MessageSquare, MessageCircle, Phone, Bell,

  // Actions
  Plus, Edit, Trash, Trash2, Download, Upload, Save, Copy, Clipboard,
  Search, Filter, RefreshCw, Share, Printer,

  // UI Elements
  Eye, EyeOff, Check, X, MoreVertical, MoreHorizontal,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp,

  // Media
  Image, Video, Music, Camera, CameraOff, Mic, MicOff,
  Play, Pause, SkipBack, SkipForward, Repeat, Shuffle,
  Volume, VolumeX,

  // Tools
  Calendar, Clock, MapPin, Globe, ExternalLink,
  Maximize, Minimize, ZoomIn, ZoomOut, RotateCw, RotateCcw,
  Move, Crop, Scissors, PenTool, Brush, Palette, Droplet,

  // Status & Info
  AlertCircle, Info, HelpCircle, Star, Heart, Bookmark, Flag,
  ThumbsUp, ThumbsDown, Award, Gift, Target, Crosshair, Anchor,

  // Charts & Data
  BarChart, PieChart, TrendingUp, TrendingDown, Activity, Percent, Hash, AtSign,

  // Weather & Nature
  Sun, Moon, Cloud, CloudRain, CloudSnow, Wind, Zap, Flame, Thermometer, Umbrella,

  // Tech
  Wifi, WifiOff, Bluetooth, Battery, BatteryCharging,

  // Misc
  Circle, Layers, Inbox, Paperclip,

  type LucideIcon
} from "lucide-react"

// Helper: Convert icon name to PascalCase
const toPascalCase = (str: string): string => {
  if (!/[-_\s]/.test(str)) {
    return str
  }
  return str
    .split(/[-_\s]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')
}

// Icon map for dynamic lookup
export const iconMap: Record<string, LucideIcon> = {
  // Navigation & Layout
  LayoutGrid, Home, Menu, Navigation, Compass, Map,

  // Content & Files
  FileText, File, FileIcon, Folder, Archive, Database,

  // E-commerce
  Package, ShoppingCart, ShoppingBag, Tag, CreditCard, Wallet, DollarSign,

  // Settings & System
  Settings, Settings2, Server, Terminal, Code, Cpu, HardDrive,

  // Users & Auth
  User, Users, UserPlus, UserCheck, UserMinus, UserX,
  LogOut, LogIn, Lock, Unlock, Key, Shield,

  // Communication
  Mail, MailOpen, Send, MessageSquare, MessageCircle, Phone, Bell,

  // Actions
  Plus, Edit, Trash, Trash2, Download, Upload, Save, Copy, Clipboard,
  Search, Filter, RefreshCw, Share, Printer,

  // UI Elements
  Eye, EyeOff, Check, X, MoreVertical, MoreHorizontal,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp,

  // Media
  Image, Video, Music, Camera, CameraOff, Mic, MicOff,
  Play, Pause, SkipBack, SkipForward, Repeat, Shuffle,
  Volume, VolumeX,

  // Tools
  Calendar, Clock, MapPin, Globe, ExternalLink,
  Maximize, Minimize, ZoomIn, ZoomOut, RotateCw, RotateCcw,
  Move, Crop, Scissors, PenTool, Brush, Palette, Droplet,

  // Status & Info
  AlertCircle, Info, HelpCircle, Star, Heart, Bookmark, Flag,
  ThumbsUp, ThumbsDown, Award, Gift, Target, Crosshair, Anchor,

  // Charts & Data
  BarChart, PieChart, TrendingUp, TrendingDown, Activity, Percent, Hash, AtSign,

  // Weather & Nature
  Sun, Moon, Cloud, CloudRain, CloudSnow, Wind, Zap, Flame, Thermometer, Umbrella,

  // Tech
  Wifi, WifiOff, Bluetooth, Battery, BatteryCharging,

  // Misc
  Circle, Layers, Inbox, Paperclip,
}

/**
 * Get icon component by name with fallback strategies
 * @param iconName - Icon name (supports PascalCase, kebab-case, snake_case)
 * @returns LucideIcon component or Circle as fallback
 */
export const getIconComponent = (iconName: string): LucideIcon => {
  if (!iconName) return Circle

  const normalizedName = toPascalCase(iconName)

  // Strategy 1: Try exact match
  let icon = iconMap[normalizedName]

  // Strategy 2: Try with "Icon" suffix
  if (!icon) {
    icon = iconMap[normalizedName + 'Icon']
  }

  // Strategy 3: Try without "Icon" suffix if present
  if (!icon && normalizedName.endsWith('Icon')) {
    icon = iconMap[normalizedName.replace(/Icon$/, '')]
  }

  // Return icon or fallback to Circle
  return icon || Circle
}

export type { LucideIcon }
