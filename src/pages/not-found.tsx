import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

export default function NotFoundPage() {
  return (
    <div className="grid place-items-center py-24 text-center">
      <div className="text-[64px] font-bold leading-none text-meta">404</div>
      <h1 className="mt-4 text-[18px] font-semibold text-fg">页面不存在</h1>
      <p className="mt-1.5 text-[13px] text-meta">你访问的页面已被移动，或从未存在。</p>
      <Link to="/" className="mt-6">
        <Button variant="primary" size="sm">
          返回服务器列表
        </Button>
      </Link>
    </div>
  )
}
