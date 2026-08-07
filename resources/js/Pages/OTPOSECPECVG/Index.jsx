import React from "react";
import { Head, Link } from "@inertiajs/react";


export default function Index({ otposecpecvg, filters }) {


    return (
        <>
            <Head title="OTPOSECPECVG" />


            <div className="p-6">


                <h1 className="text-2xl font-bold mb-5">
                    OTPOSECPECVG
                </h1>



                <table className="w-full border">


                    <thead>
                        <tr className="bg-gray-100">

                            <th className="border p-2">
                                RDS
                            </th>

                            <th className="border p-2">
                                BCA
                            </th>

                            <th className="border p-2">
                                Opérateur
                            </th>

                            <th className="border p-2">
                                Ville
                            </th>

                            <th className="border p-2">
                                Action
                            </th>

                        </tr>
                    </thead>



                    <tbody>

                    {otposecpecvg.data.map((item)=>(
                        <tr key={item.id}>

                            <td className="border p-2">
                                {item.admin_rds}
                            </td>


                            <td className="border p-2">
                                {item.admin_bca}
                            </td>


                            <td className="border p-2">
                                {item.operator_name}
                            </td>


                            <td className="border p-2">
                                {item.address_site_a_town}
                            </td>


                            <td className="border p-2">

                                <Link
                                    href={route(
                                        'otposecpecvg.show',
                                        item.id
                                    )}
                                    className="text-blue-600"
                                >
                                    Voir
                                </Link>

                            </td>

                        </tr>
                    ))}


                    </tbody>

                </table>


            </div>
        </>
    );
}
