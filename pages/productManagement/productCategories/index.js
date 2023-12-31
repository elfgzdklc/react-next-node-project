import React, { useEffect, useState } from 'react';
import { Breadcrumbs, Button } from "@mui/material";
import Link from '@mui/material/Link';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import 'moment/locale/tr';
import { Pagination, Table, CustomProvider } from 'rsuite';
import { locale } from "../../../public/rsuite/locales/tr_TR";
import alert from "../../../components/alert";
import askDelete from "../../../components/askDelete";
import { useSession } from "next-auth/react";
import Title from "../../../components/head";
import { useRouter } from "next/router";
import alertAuthority from "../../../components/alertAuthority";
import { Modal } from 'react-bootstrap';

// export async function getServerSideProps(context) {
//     const path = process.env.NEXTAUTH_URL;
//     const productCategories = await axios.post(`${path}api/productManagement/product-categories/get-product-categories`, {
//         limit: 10,
//         page: 1,
//         sortColumn: 'id',
//         sortType: 'desc',
//         search: ''
//     });
//
//     return {
//         props: {
//             productCategories: productCategories.data,
//         }, // will be passed to the page component as props
//     }
// }

export async function getServerSideProps(context) {
    const token = context.req.cookies['__Crm-next-auth.session-token']
    if (token) {
        return {
            props: {
                token: token
            },
        }
    }
    else {
        context.res.writeHead(302, { Location: `${process.env.NEXT_PUBLIC_URL}` });
    }
}
function Index(props) {
    const { register, handleSubmit, watch, setValue, getValues, reset, control, formState: { errors } } = useForm();
    const [productCategories, setProductCategories] = useState([])
    const [sortColumn, setSortColumn] = useState("created_at");
    const [sortType, setSortType] = useState("desc");
    const [limit, setLimit] = useState(10);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState();
    const { data: session } = useSession();
    const router = useRouter();

    const [show, setShow] = useState(false);
    const handleShow = () => setShow(true);
    const handleClose = () => setShow(false);

    async function getPermissionDetail() {
        setLoading(true);
        await axios({
            method: 'post',
            url: '/api/custom/get-user-permission/',
            headers: {
                'Content-Type': 'application/json',
                AuthToken: props.token
            },
            data: JSON.stringify({
                user_permission_id: session.user.permission_id
            }),
        }).then(function (response) {
            setLoading(false)
            if (response.data[0] === undefined || response.data[0].product_categories === 0) {
                if (session.user.permission_id === 1) {
                    alertAuthority(() => {
                        setTimeout(function () {
                            router.push("/dashboard")
                        }, 1000)
                    })
                } else {
                    alertAuthority(() => {
                        setTimeout(function () {
                            router.push("/userDashboard")
                        }, 1000)
                    })
                }
            } else {
                getProductCategories();
            }
        }).catch(function (error) {
            console.log(error);
        });
    }


    async function getProductCategories() {
        setLoading(true);
        await axios({
            method: 'POST',
            url: '/api/productManagement/product-categories/get-product-categories',
            headers: {
                'Content-Type': 'application/json',
                AuthToken: props.token
            },
            data: JSON.stringify({
                limit: limit,
                page: page,
                sortColumn: sortColumn,
                sortType: sortType,
                search: search
            }),
        }).then(function (response) {
            setProductCategories(response.data.data)
            setTotal(response.data.total)
            setLoading(false)
        }).catch(function (error) {
            console.log(error)
        })
    }

    async function deleteProductCategory(id) {
        let token = props.token;
        try {
            askDelete(`/api/productManagement/product-categories/delete-product-category/${id}`, token, function () {
                getProductCategories()
            });
        } catch (e) {
            console.log(e);
        }
    }

    const onSubmit = async data => {
        await axios({
            method: 'POST',
            url: '/api/productManagement/product-categories/add-edit-product-category',
            headers: {
                'Content-Type': 'application/json',
                AuthToken: props.token
            },
            data: JSON.stringify(data),
        }).then(function (res) {
            handleClose()
            getProductCategories()
            alert(res.data.title, res.data.message, res.data.status, () => {
                reset()
            })
        }).catch(function (error) {
            console.log(error)
        })
    }
    const handleChangeLimit = dataKey => {
        setPage(1)
        setLimit(dataKey)
    }

    useEffect(() => {
        getPermissionDetail()
    }, [page, search, limit, sortColumn, sortType, watch]);

    return (
        <div>
            <Title title="Ürün Kategorileri" />
            <Breadcrumbs aria-label="breadcrumb" className="bg-white mb-3 p-3 rounded shadow">
                <Link underline="none" color="inherit" href="/dashboard">
                    Ana Sayfa
                </Link>
                <Link underline="none" color="inherit" href="/productManagement/productCategories">
                    Ürün Kategorileri
                </Link>
            </Breadcrumbs>
            {/* start: Header */}
            <div className="px-3 py-2 bg-white rounded shadow d-flex align-items-center justify-content-between">
                <div className="row w-100">
                    <div className="col-md-4 col-12 mb-2 mb-md-0">
                        <h5 className="fw-bold mb-0">
                            <Button variant="outlined" className="text-capitalize btn-custom" onClick={() => {
                                reset()
                                setValue("id", 0)
                                handleShow()
                            }}><i className="fas fa-plus me-1"></i>
                                Yeni Ürün Kategorisi
                            </Button>
                        </h5>
                    </div>
                    <div className="col-md-8 col-12 d-flex justify-content-end pe-0">
                        <h5 className="fw-bold mb-0  mbl-w-100">
                            <div className="d-flex" role="search">
                                <input className="form-control form-control-sm me-2" type="search" placeholder="Arama"
                                    aria-label="Arama"
                                    onChange={(e) => setSearch(e.target.value)} />
                                <button className="btn btn-outline-secondary"><i className="fal fa-search"></i></button>
                            </div>
                        </h5>
                    </div>
                </div>
            </div>
            {/*end: Header*/}
            <div className="px-3 mt-2 py-2 bg-white rounded shadow">
                <div>
                    <CustomProvider locale={locale}>
                        <Table
                            height={400}
                            loading={loading}
                            autoHeight={true}
                            data={productCategories}
                            cellBordered={true}
                            hover={true}
                            bordered={true}
                            onSortColumn={(sortColumn, sortType) => {
                                setSortColumn(sortColumn);
                                setSortType(sortType);
                            }}
                            sortColumn={sortColumn}
                            sortType={sortType}
                        >
                            <Table.Column width={150} sortable={true}>
                                <Table.HeaderCell>Id</Table.HeaderCell>
                                <Table.Cell dataKey="id" />
                            </Table.Column>
                            <Table.Column sortable={true} flexGrow={1}>
                                <Table.HeaderCell>Kategori Adı</Table.HeaderCell>
                                <Table.Cell dataKey="category_name" />
                            </Table.Column>
                            <Table.Column width={200}>
                                <Table.HeaderCell align={"center"}>İşlemler</Table.HeaderCell>
                                <Table.Cell align={"center"}>
                                    {rowData => (
                                        <>
                                            <a className="cursor-pointer" title="Düzenle"
                                                onClick={() => {
                                                    reset();
                                                    setValue('id', rowData.id);
                                                    setValue('category_name', rowData.category_name);
                                                    handleShow()
                                                }}>
                                                <i className="fal fa-edit me-2"></i>
                                            </a>
                                            {
                                                session.user.permission_id === 1 ? (
                                                    <a className="cursor-pointer" title="Sil" onClick={() => {
                                                        deleteProductCategory(rowData.id)
                                                    }}>
                                                        <i className="fal fa-trash-alt"></i>
                                                    </a>
                                                ) : null
                                            }
                                        </>
                                    )}
                                </Table.Cell>
                            </Table.Column>
                        </Table>
                        <Pagination className="mt-2"
                            prev
                            next
                            first
                            last
                            ellipsis
                            boundaryLinks
                            maxButtons={5}
                            size="xs"
                            layout={['total', '-', 'limit', '|', 'pager', 'skip']}
                            total={total}
                            limitOptions={[5, 10, 20, 50, 100]}
                            limit={limit}
                            activePage={page}
                            onChangePage={setPage}
                            onChangeLimit={handleChangeLimit}
                        />
                    </CustomProvider>
                </div>
            </div>
            <Modal size="md" show={show} onHide={handleClose} backdrop="static" keyboard={false} aria-labelledby="example-modal-sizes-title-md">
                <Modal.Header closeButton>
                    <p className="modal-title fs-6 fw-semibold">
                        Kategori {watch("id") && watch("id") != 0 ? 'Düzenle' : 'Ekle'}
                    </p>
                </Modal.Header>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Modal.Body>
                        <div className="row">
                            <div className="col-12">
                                <label className="pb-2">Kategori Adı</label>
                                <span className="registerTitle text-danger fw-bold"> *</span>
                                <input type="text"
                                    className={"form-control form-control-sm  " + (errors.category_name ? "is-invalid" : "")}
                                    autoFocus={true}
                                    maxLength={50}
                                    name="category_name"
                                    {...register("category_name", { required: true })} />
                                {errors.category_name &&
                                    <div className="invalid-feedback text-start">Bu
                                        alan
                                        zorunlu.</div>}
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={handleClose}
                        >Vazgeç
                        </button>
                        <button className="btn-custom-save btn-sm" type="submit" {...register('id')}>Kaydet</button>
                    </Modal.Footer>
                </form>
            </Modal>
        </div>
    );
}

Index.auth = true;
export default Index;

