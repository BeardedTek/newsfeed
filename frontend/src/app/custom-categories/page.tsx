'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost, apiPut, apiDelete } from '@/utils/api';
import { Button, Table, Modal, Label, TextInput, Select, Checkbox } from 'flowbite-react';
import { HiPlus, HiPencil, HiTrash, HiX } from 'react-icons/hi';

interface Source {
  id: string;
  title: string;
}

interface Category {
  id: string;
  name: string;
}

interface CustomCategory {
  id: number;
  name: string;
  sources: string[];
  categories: string[];
  search: string;
  created_at: string;
  updated_at: string;
}

export default function CustomCategoriesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [stockCategories, setStockCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CustomCategory | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchTerms, setSearchTerms] = useState('');
  
  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [user, loading, router]);
  
  // Load data
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Load custom categories
        const categoriesResponse = await apiGet('/user/custom-categories');
        setCategories(categoriesResponse);
        
        // Load sources
        const sourcesResponse = await apiGet('/sources/');
        setSources(sourcesResponse.sources || []);
        
        // Load stock categories
        const stockCategoriesResponse = await apiGet('/categories/');
        setStockCategories(stockCategoriesResponse.categories.map((name: string) => ({ id: name, name })) || []);
        
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [user]);
  
  const resetForm = () => {
    setName('');
    setSelectedSources([]);
    setSelectedCategories([]);
    setSearchTerms('');
    setEditingCategory(null);
  };
  
  const handleOpenModal = (category: CustomCategory | null = null) => {
    resetForm();
    
    if (category) {
      setEditingCategory(category);
      setName(category.name);
      setSelectedSources(category.sources || []);
      setSelectedCategories(category.categories || []);
      setSearchTerms(category.search || '');
    }
    
    setShowModal(true);
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };
  
  const handleSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setSelectedSources(selectedOptions);
  };
  
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setSelectedCategories(selectedOptions);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name) {
      setError('Name is required');
      return;
    }
    
    try {
      const categoryData = {
        name,
        sources: selectedSources,
        categories: selectedCategories,
        search: searchTerms
      };
      
      let response;
      
      if (editingCategory) {
        // Update existing category
        response = await apiPut(`/user/custom-categories/${editingCategory.id}`, categoryData);
        
        // Update the categories list
        setCategories(prevCategories => 
          prevCategories.map(cat => 
            cat.id === editingCategory.id ? { ...cat, ...response } : cat
          )
        );
      } else {
        // Create new category
        response = await apiPost('/user/custom-categories', categoryData);
        
        // Add to the categories list
        setCategories(prevCategories => [...prevCategories, response]);
      }
      
      handleCloseModal();
      
    } catch (err) {
      console.error('Error saving category:', err);
      setError('Failed to save category. Please try again.');
    }
  };
  
  const handleDelete = async (categoryId: number) => {
    if (!confirm('Are you sure you want to delete this category?')) {
      return;
    }
    
    try {
      await apiDelete(`/user/custom-categories/${categoryId}`);
      
      // Remove from the categories list
      setCategories(prevCategories => 
        prevCategories.filter(cat => cat.id !== categoryId)
      );
      
    } catch (err) {
      console.error('Error deleting category:', err);
      setError('Failed to delete category. Please try again.');
    }
  };
  
  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Custom Categories</h1>
        <Button onClick={() => handleOpenModal()} color="blue">
          <HiPlus className="mr-2 h-5 w-5" />
          Add Category
        </Button>
      </div>
      
      {error && (
        <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-red-800/20 dark:text-red-400" role="alert">
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">You haven't created any custom categories yet.</p>
          <Button onClick={() => handleOpenModal()} color="blue" className="mt-4">
            <HiPlus className="mr-2 h-5 w-5" />
            Create Your First Category
          </Button>
        </div>
      ) : (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
          <Table hoverable>
            <Table.Head>
              <Table.HeadCell>Name</Table.HeadCell>
              <Table.HeadCell>Sources</Table.HeadCell>
              <Table.HeadCell>Categories</Table.HeadCell>
              <Table.HeadCell>Search Terms</Table.HeadCell>
              <Table.HeadCell>Actions</Table.HeadCell>
            </Table.Head>
            <Table.Body className="divide-y">
              {categories.map(category => (
                <Table.Row key={category.id} className="bg-white dark:bg-gray-800">
                  <Table.Cell className="font-medium text-gray-900 dark:text-white">
                    {category.name}
                  </Table.Cell>
                  <Table.Cell>
                    {category.sources && category.sources.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {category.sources.map(sourceId => {
                          const source = sources.find(s => s.id === sourceId);
                          return (
                            <span key={sourceId} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded dark:bg-blue-900 dark:text-blue-300">
                              {source ? source.title : sourceId}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">None</span>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    {category.categories && category.categories.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {category.categories.map(catName => (
                          <span key={catName} className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded dark:bg-green-900 dark:text-green-300">
                            {catName}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">None</span>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    {category.search ? (
                      <span className="font-mono text-sm">{category.search}</span>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">None</span>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex space-x-2">
                      <Button size="xs" color="light" onClick={() => handleOpenModal(category)}>
                        <HiPencil className="h-4 w-4" />
                      </Button>
                      <Button size="xs" color="failure" onClick={() => handleDelete(category.id)}>
                        <HiTrash className="h-4 w-4" />
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
      )}
      
      {/* Add/Edit Category Modal */}
      <Modal show={showModal} onClose={handleCloseModal} size="lg">
        <Modal.Header>
          {editingCategory ? 'Edit Category' : 'Add New Category'}
        </Modal.Header>
        <form onSubmit={handleSubmit}>
          <Modal.Body>
            <div className="space-y-6">
              <div>
                <div className="mb-2 block">
                  <Label htmlFor="name" value="Name" />
                </div>
                <TextInput
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter category name"
                  required
                />
              </div>
              
              <div>
                <div className="mb-2 block">
                  <Label htmlFor="sources" value="Sources" />
                </div>
                <Select
                  id="sources"
                  multiple
                  value={selectedSources}
                  onChange={handleSourceChange}
                  className="h-32"
                >
                  {sources.map(source => (
                    <option key={source.id} value={source.id}>
                      {source.title}
                    </option>
                  ))}
                </Select>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Hold Ctrl (or Cmd) to select multiple sources
                </p>
              </div>
              
              <div>
                <div className="mb-2 block">
                  <Label htmlFor="categories" value="Categories" />
                </div>
                <Select
                  id="categories"
                  multiple
                  value={selectedCategories}
                  onChange={handleCategoryChange}
                  className="h-32"
                >
                  {stockCategories.map(category => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </Select>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Hold Ctrl (or Cmd) to select multiple categories
                </p>
              </div>
              
              <div>
                <div className="mb-2 block">
                  <Label htmlFor="search" value="Search Terms" />
                </div>
                <TextInput
                  id="search"
                  value={searchTerms}
                  onChange={(e) => setSearchTerms(e.target.value)}
                  placeholder="Enter search terms"
                />
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button type="submit" color="blue">
              {editingCategory ? 'Save Changes' : 'Add Category'}
            </Button>
            <Button color="gray" onClick={handleCloseModal}>
              Cancel
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  );
} 