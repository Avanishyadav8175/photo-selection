# 📅 Booking Management System - Complete Documentation

## ✅ What's Been Created

A complete booking management system has been integrated into your image selection app with the following features:

### 🎯 Core Features

1. **Vertical Sidebar Navigation**
   - Photo Selection (existing feature)
   - Booking Management (new)
   - Trash (existing feature)
   - Logout button

2. **Booking Management**
   - Create new bookings with customer details
   - Wedding events (Tilak, Haldi, Wedding)
   - Non-wedding events (Engagement, Birthday, Mundan, Other)
   - Service selection (Photo, Video, Drone)
   - Financial tracking (Total, Advance, Due)

3. **Team Assignment**
   - Assign team members to specific events
   - View team assignments per event
   - Multiple members per event

4. **Payment Management**
   - Add payments with date and mode
   - Payment history tracking
   - Automatic due calculation
   - Multiple payment modes (Cash, Online, UPI, Card, Cheque)

5. **Expense Tracking**
   - Add expenses per booking
   - Track total expenses
   - Calculate net profit (Paid - Expenses)

6. **Calendar View**
   - Monthly calendar with booking indicators
   - Click on dates to see bookings
   - Navigate between months
   - Visual indicators for bookings

7. **Manpower Management**
   - Add/Edit/Delete team members
   - Set rates per event type
   - Track total earnings per member
   - Specialty categorization

8. **Analytics Dashboard**
   - Total bookings count
   - Upcoming bookings
   - Total paid amount
   - Events covered count

---

## 📁 Files Created

### Frontend Pages (9 files)
1. `app/admin/layout.tsx` - Vertical sidebar layout
2. `app/admin/bookings/page.tsx` - Main bookings dashboard
3. `app/admin/bookings/create/page.tsx` - Create booking form
4. `app/admin/bookings/[id]/page.tsx` - Booking details
5. `app/admin/bookings/[id]/assign/page.tsx` - Team assignment
6. `app/admin/bookings/[id]/payment/page.tsx` - Add payment
7. `app/admin/bookings/calendar/page.tsx` - Calendar view
8. `app/admin/bookings/manpower/page.tsx` - Manpower management

### Backend API Routes (8 files)
1. `app/api/admin/bookings/route.ts` - List/Create bookings
2. `app/api/admin/bookings/[id]/route.ts` - Get/Update/Delete booking
3. `app/api/admin/bookings/[id]/expenses/route.ts` - Add expense
4. `app/api/admin/bookings/[id]/expenses/[expenseId]/route.ts` - Delete expense
5. `app/api/admin/bookings/[id]/payments/route.ts` - Add payment
6. `app/api/admin/bookings/[id]/assign/route.ts` - Assign team
7. `app/api/admin/manpower/route.ts` - List/Create manpower
8. `app/api/admin/manpower/[id]/route.ts` - Get/Update/Delete manpower

### Database Types
Updated `lib/types.ts` with:
- `Booking` interface
- `BookingEvent` interface
- `Payment` interface
- `Expense` interface
- `Manpower` interface
- `ManpowerRates` interface

---

## 🗄️ Database Collections

### `bookings` Collection
```typescript
{
  id: number,
  name: string,
  mobile: string,
  whatsapp?: string,
  customerAddress?: string,
  venueAddress?: string,
  eventType: string,
  mainEventDate: string,
  events: [{
    name: string,
    date: string,
    time: 'Day' | 'Night',
    services: string[],
    team: string[]
  }],
  total: number,
  due: number,
  note?: string,
  payments: [{
    id: number,
    amount: number,
    date: string,
    mode: string,
    note: string
  }],
  expenses: [{
    id: number,
    desc: string,
    amount: number
  }],
  createdAt: Date,
  status: 'active' | 'deleted'
}
```

### `manpower` Collection
```typescript
{
  id: number,
  name: string,
  whatsapp?: string,
  specialty: string,
  rates: {
    tilak?: number,
    haldi?: number,
    wedding?: number,
    engagement?: number,
    birthday?: number,
    mundan?: number
  },
  createdAt: Date,
  status: 'active' | 'deleted'
}
```

---

## 🚀 How to Use

### 1. Access Booking Management
- Login to admin panel
- Click "Booking Management" in the sidebar
- You'll see the dashboard with analytics

### 2. Create a Booking
- Click "Create New Booking" button
- Fill in customer details
- Select event type (Wedding or other)
- For weddings: Add Tilak, Haldi, Wedding details
- For others: Add single event details
- Select services (Photo, Video, Drone)
- Enter financial details
- Click "Preview Booking"
- Confirm to create

### 3. Manage Bookings
- View all bookings on dashboard
- Search by name or mobile
- Filter by status (Upcoming/Completed)
- Click "View Details" to see full booking
- Add payments, expenses, assign team

### 4. Assign Team
- Click "Assign Team" on any booking
- Select team members for each event
- Multiple members can be assigned
- Save assignment

### 5. Add Payments
- Click "Add Payment" on booking
- Enter amount (cannot exceed due)
- Select payment mode
- Add optional note
- Submit

### 6. Track Expenses
- Open booking details
- Click "Add Expense"
- Enter description and amount
- View net profit calculation

### 7. Manage Manpower
- Go to "Manage Manpower"
- Add new team members
- Set rates for each event type
- View total earnings per member
- Edit or delete members

### 8. Calendar View
- Click "Calendar View"
- Navigate months with arrows
- Click on dates to see bookings
- Dates with bookings have indicators

---

## 🎨 Features Highlights

### Financial Tracking
- **Total Amount**: Full booking value
- **Total Paid**: Sum of all payments
- **Total Expenses**: Sum of all expenses
- **Due Amount**: Total - Total Paid
- **Net Profit**: Total Paid - Total Expenses

### Status Indicators
- **Upcoming**: Events in the future (Blue badge)
- **Completed**: Events in the past (Green badge)

### Team Earnings
- Automatically calculated based on:
  - Events they're assigned to
  - Their rates for those event types
- Displayed on manpower cards

### Search & Filter
- Search by customer name or mobile
- Filter by month
- Filter by status (Upcoming/Completed)

---

## 🔧 Technical Details

### Authentication
All API routes require admin JWT token:
```typescript
headers: {
  Authorization: `Bearer ${token}`
}
```

### Data Flow
1. Frontend fetches data from API routes
2. API routes verify authentication
3. MongoDB operations performed
4. Response sent back to frontend
5. UI updates with new data

### Error Handling
- All API routes have try-catch blocks
- User-friendly error messages
- Console logging for debugging

---

## 📊 Analytics Calculations

### Total Bookings
Count of all active bookings

### Upcoming Bookings
Bookings where `mainEventDate >= today`

### Total Paid
Sum of all payment amounts across all bookings

### Events Covered
Sum of all events across all bookings

### Net Profit (Per Booking)
`Total Paid - Total Expenses`

### Member Earnings
For each booking event:
- If member is in event.team
- Add member.rates[eventType] to total

---

## 🎯 Next Steps

### To Start Using:
1. ✅ All files are created
2. ✅ Database types are defined
3. ✅ API routes are ready
4. ✅ UI pages are complete

### First Time Setup:
1. Login to admin panel
2. Go to "Booking Management"
3. Add team members in "Manage Manpower"
4. Create your first booking
5. Assign team to events
6. Track payments and expenses

---

## 🐛 Troubleshooting

### Issue: Sidebar not showing
**Solution**: Clear browser cache and refresh

### Issue: API errors
**Solution**: Check MongoDB connection and admin token

### Issue: Bookings not loading
**Solution**: Ensure `bookings` collection exists in MongoDB

### Issue: Team assignment not working
**Solution**: Add team members in Manpower Management first

---

## 🎉 Features Summary

✅ Complete booking management system
✅ Vertical sidebar navigation
✅ Customer & event management
✅ Financial tracking (payments, expenses, profit)
✅ Team assignment & earnings tracking
✅ Calendar view with visual indicators
✅ Manpower management with rates
✅ Search & filter functionality
✅ Analytics dashboard
✅ Mobile responsive design
✅ Beautiful gradient UI
✅ Real-time calculations

---

## 📞 Support

If you encounter any issues:
1. Check browser console for errors
2. Verify MongoDB collections exist
3. Ensure admin authentication works
4. Check API route responses in Network tab

---

## 🏆 Success!

Your image selection app now has a complete booking management system integrated! 

**Access it at**: `/admin/bookings`

The system is production-ready and fully functional! 🎉
