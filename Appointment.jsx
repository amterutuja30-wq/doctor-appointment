import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { assets } from '../assets/assets'
import RelatedDoctors from '../components/RelatedDoctors'
import { toast } from 'react-toastify'
import axios from 'axios'

const Appointment = () => {
  const { docId } = useParams()
  const { doctors, currencySymbol, backendUrl, token, getDoctorsData } = useContext(AppContext)
  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  const navigate = useNavigate()

  const [docInfo, setDocInfo] = useState(null)
  const [docSlots, setDocSlots] = useState([])
  const [slotIndex, setSlotIndex] = useState(0)
  const [slotTime, setSlotTime] = useState('')

  // Fetch Doctor Info
  const fetchDocInfo = () => {
    if (!doctors || doctors.length === 0) return
    const docInfoData = doctors.find(doc => String(doc._id) === String(docId))
    if (docInfoData) setDocInfo(docInfoData)
  }

  // Generate Slots safely
  const getAvailableSlots = () => {
    if (!docInfo) return

    const today = new Date()
    const allSlots = []

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(today)
      currentDate.setDate(today.getDate() + i)

      const endTime = new Date(today)
      endTime.setDate(today.getDate() + i)
      endTime.setHours(21, 0, 0, 0)

      if (today.getDate() === currentDate.getDate()) {
        currentDate.setHours(Math.max(currentDate.getHours() + 1, 10))
        currentDate.setMinutes(currentDate.getMinutes() > 30 ? 30 : 0)
      } else {
        currentDate.setHours(10)
        currentDate.setMinutes(0)
      }

      const timeSlots = []
      const tempDate = new Date(currentDate) // avoid mutation issues
      while (tempDate < endTime) {
        const formattedTime = tempDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

        let day = currentDate.getDate()
        let month = currentDate.getMonth() + 1
        let year = currentDate.getFullYear()

        const slotDate = day + "_" + month + "_" + year
        const slotTime = formattedTime

        const isSlotAvailable = docInfo.slots_booked[slotDate] && docInfo.slots_booked[slotDate].includes(slotTime) ? false : true

        if (isSlotAvailable) {
          timeSlots.push({ datetime: new Date(tempDate), time: formattedTime })

        }

        tempDate.setMinutes(tempDate.getMinutes() + 30)
      }
      allSlots.push(timeSlots)
    }

    setDocSlots(allSlots)
  }

  // Book Appointment safely
  const bookAppointment = async () => {
    if (!token) {
      toast.warn('Login to book appointment')
      return navigate('/login')
    }
    if (!slotTime) {
      toast.warn('Please select time slot')
      return
    }

    const slotDateObj = docSlots[slotIndex]?.[0]?.datetime
    if (!slotDateObj) {
      toast.error('No slot selected')
      return
    }

    const slotDate = `${slotDateObj.getDate()}_${slotDateObj.getMonth() + 1}_${slotDateObj.getFullYear()}`

    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/book-appointment`,
        { docId, slotDate, slotTime },
        { headers: { token } }
      )

      if (data.success) {
        toast.success(data.message)
        getDoctorsData()
        navigate('/my-appointments')
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.error(error)
      toast.error('Something went wrong while booking')
    }
  }

  useEffect(() => { fetchDocInfo() }, [doctors, docId])
  useEffect(() => { getAvailableSlots() }, [docInfo])

  return (
    <div>
      {docInfo && (
        <>
          {/* Doctor Details */}
          <div className='flex flex-col sm:flex-row gap-4'>
            <div>
              <img className='bg-primary w-full sm:max-w-72 rounded-lg' src={docInfo.image} alt={docInfo.name} />
            </div>

            <div className='flex-1 border border-gray-400 rounded-lg p-8 py-7 bg-white'>
              <p className='flex items-center gap-2 text-2xl font-medium text-gray-900'>
                {docInfo.name}<img className='w-5' src={assets.verified_icon} alt="" />
              </p>
              <div className='flex items-center gap-2 text-sm mt-1 text-gray-600'>
                <p>{docInfo.degree} - {docInfo.speciality}</p>
                <button className='py-0.5 px-2 border text-xs rounded-full'>{docInfo.experience}</button>
              </div>
              <p className='text-sm text-gray-500 max-w-[700px] mt-3'>{docInfo.about}</p>
              <p className='text-gray-500 font-medium mt-4'>Appointment fee: <span className='text-gray-600'>{currencySymbol}{docInfo.fees}</span></p>
            </div>
          </div>

          {/* Booking Slots */}
          <div className='sm:ml-72 sm:pl-4 mt-6 font-medium text-gray-700'>
            <p>Booking slots</p>
            <div className='flex gap-3 items-center w-full overflow-x-scroll mt-4'>
              {docSlots.map((item, index) => (
                <div key={index} onClick={() => setSlotIndex(index)} className={`text-center py-6 min-w-16 rounded-full cursor-pointer ${slotIndex === index ? 'bg-primary text-white' : 'border border-gray-200'}`}>
                  <p>{item[0] && daysOfWeek[item[0].datetime.getDay()]}</p>
                  <p>{item[0] && item[0].datetime.getDate()}</p>
                </div>
              ))}
            </div>

            <div className='flex items-center gap-3 w-full overflow-x-scroll mt-4'>
              {docSlots.length > 0 && docSlots[slotIndex]?.map((item, index) => (
                <p key={index} onClick={() => setSlotTime(item.time)} className={`text-sm px-5 py-2 rounded-full cursor-pointer ${slotTime === item.time ? 'bg-primary text-white' : 'text-gray-400 border border-gray-300'}`}>
                  {item.time.toLowerCase()}
                </p>
              ))}
            </div>

            <button onClick={bookAppointment} className='bg-primary text-white text-sm px-14 py-3 rounded-full my-6'>
              Book an appointment
            </button>
          </div>

          <RelatedDoctors docId={docId} speciality={docInfo.speciality} />
        </>
      )}
    </div>
  )
}

export default Appointment