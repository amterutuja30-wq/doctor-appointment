import doctorModel from "../models/doctorModel.js"

// Toggle doctor availability safely
const changeAvailability = async (req, res) => {
  try {
    const { docId } = req.body

    // Find doctor by ID
    const docData = await doctorModel.findById(docId)
    

    // Check if doctor exists
    if (!docData) {
      return res.status(404).json({ success: false, message: 'Doctor not found' })
    }

    // Toggle availability
    docData.available = !docData.available
    await docData.save()

    res.json({ success: true, message: 'Availability changed' })

  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// Get list of doctors
const doctorList = async (req, res) => {
  try {
    const doctors = await doctorModel.find({})
      .select(['_id', 'name', 'available', 'image', 'speciality', 'degree', 'experience', 'about', 'fees', 'address','slots_booked'])

    res.json({ success: true, doctors })

  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, message: error.message })
  }
}

export { changeAvailability, doctorList }