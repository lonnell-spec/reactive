'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Menu, X, Users, Search, Shield, Home, User } from 'lucide-react'

interface AdminMenuProps {
  currentPath?: string
}

export function AdminMenu({ currentPath }: AdminMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const menuItems = [
    {
      title: 'Dashboard',
      description: 'View and manage guest submissions',
      icon: Home,
      path: '/admin',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      title: 'Manual Verification',
      description: 'Search and verify guests manually',
      icon: Search,
      path: '/admin/manual-verification',
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      title: 'User Management',
      description: 'Manage user roles and permissions',
      icon: Users,
      path: '/admin/users',
      color: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      title: 'My Profile',
      description: 'Update your email and phone',
      icon: User,
      path: '/admin/profile',
      color: 'bg-orange-600 hover:bg-orange-700'
    }
  ]

  const handleNavigate = (path: string) => {
    router.push(path)
    setIsOpen(false)
  }

  return (
    <>
      {/* Menu Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-50 bg-white border-2 border-gray-300 shadow-lg sm:hidden"
      >
        {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </Button>

      {/* Desktop Menu */}
      <div className="hidden sm:block mb-4">
        <div className="flex flex-wrap gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPath === item.path
            return (
              <Button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                className={`${isActive 
                  ? 'bg-red-600 hover:bg-red-700 text-white border-red-600' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {item.title}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 sm:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu Content */}
          <div className="absolute top-16 right-4 left-4 bg-white rounded-lg shadow-xl border-2 border-gray-200 max-w-sm mx-auto">
            <div className="p-3">
              <h2 className="text-base font-semibold mb-3 flex items-center">
                <Shield className="w-4 h-4 mr-2 flex-shrink-0" />
                Admin Menu
              </h2>
              <div className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  const isActive = currentPath === item.path
                  return (
                    <Button
                      key={item.path}
                      onClick={() => handleNavigate(item.path)}
                      variant="outline"
                      className={`w-full h-auto p-3 flex items-start text-left border-gray-200 ${
                        isActive 
                          ? 'bg-red-50 border-red-600 text-red-700' 
                          : 'hover:bg-red-50 hover:border-red-600 hover:text-red-700'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm truncate">{item.title}</div>
                        <div className="text-xs opacity-75 mt-0.5 line-clamp-2">{item.description}</div>
                      </div>
                    </Button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
