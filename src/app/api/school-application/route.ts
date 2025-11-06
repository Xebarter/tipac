import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const {
      institutionName,
      address,
      city,
      contactPerson,
      email,
      phone,
      institutionType,
      numberOfStudents,
      gradeLevels,
      interestReason
    } = data;

    // Basic validation
    if (!institutionName || !address || !city || !contactPerson || 
        !email || !phone || !institutionType || !numberOfStudents || 
        !gradeLevels || !interestReason) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Insert into database
    const { data: application, error } = await supabase
      .from('school_applications')
      .insert([
        {
          institution_name: institutionName,
          address: address,
          city: city,
          contact_person: contactPerson,
          email: email,
          phone: phone,
          institution_type: institutionType,
          number_of_students: parseInt(numberOfStudents),
          grade_levels: gradeLevels,
          interest_reason: interestReason,
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to submit application' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Application submitted successfully',
      application 
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}