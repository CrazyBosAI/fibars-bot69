const handleDemoLogin = () => {
  // Set demo user data
  const demoUser = {
    id: 'e8f5a2d1-4b3c-4d5e-8f9a-1b2c3d4e5f6g',
    email: 'test69@fibars.com',
    name: 'Test Enterprise User',
    subscription_tier: 'enterprise',
    avatar_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150'
  };
  
        </div>
      </form>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Test Enterprise Account</h3>
        <div className="text-xs text-blue-700 space-y-1">
          <p><strong>Email:</strong> test69@fibars.com</p>
          <p><strong>Password:</strong> test69Fibars</p>
          <p><strong>Plan:</strong> Enterprise (Full Access)</p>
        </div>
      </div>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
        <button
          onClick={handleDemoLogin}
          className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Login as Enterprise User
        </button>
      </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
};